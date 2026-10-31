from fastapi import FastAPI, APIRouter, HTTPException, Request, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from bson import ObjectId
from bson.errors import InvalidId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, BeforeValidator, EmailStr, ConfigDict
from typing import Annotated, Literal, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from email_service import ADMIN_EMAIL, clinic_application_email, order_confirmation_email, rate_limited, send_email  # noqa: E402
from push_service import register_device, reminder_loop, reminders_started_now, safe_push  # noqa: E402
import asyncio  # noqa: E402

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()


@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}


api_router = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude={"id"})
        return data

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc)


# Server-side source of truth for pricing (SGD)
PLANS = {
    "one_time": {"name": "BioRNA-C · One-time purchase", "unit_price": 300, "bundle_price": 275, "min_qty": 1, "max_qty": 10,
                 "interval": None, "allowed_qty": None},
    "subscribe": {"name": "Auto-Ship · Every 2 Weeks", "unit_price": 275, "min_qty": 2, "max_qty": 4,
                  "interval": "Every 2 weeks", "allowed_qty": [2, 4]},
    "clinic": {"name": "Clinic & Multi-Pack Program", "unit_price": 185, "min_qty": 2, "max_qty": 100,
               "interval": None, "allowed_qty": [2, 5, 10]},
}


class Customer(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=30)
    address: str = Field(min_length=5, max_length=300)
    postal_code: str = Field(min_length=4, max_length=12)
    clinic_name: Optional[str] = Field(default=None, max_length=160)


class OrderCreate(BaseModel):
    plan: Literal["one_time", "subscribe"]
    quantity: int = Field(ge=1, le=100)
    payment_method: Literal["apple_pay", "google_pay", "card"]
    customer: Customer


class Order(BaseDocument):
    order_number: str
    plan: str
    plan_name: str
    interval: Optional[str] = None
    quantity: int
    unit_price: int
    subtotal: int
    shipping: int
    total: int
    currency: str = "SGD"
    payment_method: str
    payment_status: str = "mock_paid"
    customer: Customer
    created_at: str
    reminders_enabled: bool = False


class ReminderOptIn(BaseModel):
    push_user_id: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")


class RegisterPushBody(BaseModel):
    user_id: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    platform: Literal["android", "ios"]
    device_token: str = Field(min_length=10, max_length=512)

@api_router.get("/")
async def root():
    return {"message": "BioRNA Antiscar API"}


@api_router.get("/pricing")
async def pricing():
    return {"currency": "SGD", "plans": PLANS}


def client_ip(request: Request) -> str:
    # Rightmost X-Forwarded-For entry is appended by our ingress; leftmost values are client-controlled.
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[-1].strip()
    return request.client.host if request.client else "?"


def email_key(email: str) -> str:
    local, _, domain = email.lower().partition("@")
    return f"{local.split('+')[0].replace('.', '')}@{domain}"


async def send_and_record(collection: str, doc_id: str, **kwargs):
    status = await send_email(**kwargs)
    await db[collection].update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"email_status": status, "email_updated_at": datetime.now(timezone.utc).isoformat()}},
    )


@api_router.post("/orders", response_model=Order, response_model_by_alias=False)
async def create_order(payload: OrderCreate, request: Request, background: BackgroundTasks):
    plan = PLANS[payload.plan]
    if payload.quantity < plan["min_qty"] or payload.quantity > plan["max_qty"]:
        raise HTTPException(400, f"Quantity must be between {plan['min_qty']} and {plan['max_qty']}")
    if plan["allowed_qty"] and payload.quantity not in plan["allowed_qty"]:
        raise HTTPException(400, f"Quantity must be one of {plan['allowed_qty']}")
    if payload.plan == "clinic" and not (payload.customer.clinic_name or "").strip():
        raise HTTPException(400, "Clinic / provider name is required for partner orders")
    ip = client_ip(request)
    if rate_limited(f"order:{ip}", 20) or rate_limited(f"order-email:{email_key(payload.customer.email)}", 5):
        raise HTTPException(429, "Too many orders. Please try again later.")
    unit_price = plan.get("bundle_price", plan["unit_price"]) if payload.quantity >= 2 else plan["unit_price"]
    subtotal = unit_price * payload.quantity
    shipping = 0
    now = datetime.now(timezone.utc)
    counter = await db.counters.find_one_and_update(
        {"_id": "orders"}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER
    )
    order = Order(
        order_number=f"BRNA-{now.strftime('%y%m%d')}-{counter['seq']:04d}",
        plan=payload.plan,
        plan_name=plan["name"],
        interval=plan["interval"],
        quantity=payload.quantity,
        unit_price=unit_price,
        subtotal=subtotal,
        shipping=shipping,
        total=subtotal + shipping,
        payment_method=payload.payment_method,
        customer=payload.customer,
        created_at=now.isoformat(),
    )
    res = await db.orders.insert_one(order.to_mongo())
    order.id = str(res.inserted_id)
    subject, html = order_confirmation_email(order)
    background.add_task(send_and_record, "orders", order.id, to=order.customer.email, subject=subject, html=html)
    return order


class ClinicApplicationCreate(BaseModel):
    clinic_name: str = Field(min_length=2, max_length=160)
    contact_name: Optional[str] = Field(default=None, max_length=120)
    role: Optional[str] = Field(default=None, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=30)
    credentials: str = Field(min_length=3, max_length=500)
    location: Optional[str] = Field(default=None, max_length=120)
    practice_type: Optional[Literal["Aesthetic clinic", "Dermatology", "O&G / Maternity", "Plastic surgery", "General practice", "Pharmacy / Retail", "Other"]] = None
    monthly_volume: Optional[Literal["2–5 boxes", "6–20 boxes", "21–50 boxes", "50+ boxes"]] = None
    message: Optional[str] = Field(default=None, max_length=1500)


class ClinicApplication(BaseDocument, ClinicApplicationCreate):
    status: str = "new"
    created_at: str


@api_router.post("/clinic-applications", response_model=ClinicApplication, response_model_by_alias=False)
async def create_clinic_application(payload: ClinicApplicationCreate, request: Request, background: BackgroundTasks):
    if rate_limited(f"clinic:{client_ip(request)}", 5) or rate_limited("clinic:global", 50):
        raise HTTPException(429, "Too many applications. Please try again later.")
    app_doc = ClinicApplication(**payload.model_dump(), created_at=datetime.now(timezone.utc).isoformat())
    res = await db.clinic_applications.insert_one(app_doc.to_mongo())
    app_doc.id = str(res.inserted_id)
    subject, html = clinic_application_email(app_doc)
    background.add_task(send_and_record, "clinic_applications", app_doc.id, to=ADMIN_EMAIL, subject=subject, html=html)
    return app_doc


@api_router.get("/orders/{order_id}", response_model=Order, response_model_by_alias=False)
async def get_order(order_id: str):
    try:
        oid = ObjectId(order_id)
    except (InvalidId, TypeError):
        raise HTTPException(404, "Order not found")
    doc = await db.orders.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Order not found")
    return Order.from_mongo(doc)


@api_router.post("/register-push", status_code=201)
async def register_push(body: RegisterPushBody, request: Request):
    if rate_limited(f"push-reg:{client_ip(request)}", 30):
        raise HTTPException(429, "Too many requests")
    await register_device(body.model_dump())
    return {"status": "registered"}


@api_router.post("/orders/{order_id}/reminders", response_model=Order, response_model_by_alias=False)
async def enable_reminders(order_id: str, body: ReminderOptIn):
    try:
        oid = ObjectId(order_id)
    except (InvalidId, TypeError):
        raise HTTPException(404, "Order not found")
    doc = await db.orders.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Order not found")
    prev = await db.orders.find_one_and_update({"_id": oid, "reminders_enabled": {"$ne": True}}, {"$set": {
        "push_user_id": body.push_user_id,
        "reminders_enabled": True,
        "reminders_started_at": doc.get("reminders_started_at") or reminders_started_now(),
    }})
    first_time = prev is not None and not prev.get("reminders_started_at")
    if prev is None:
        await db.orders.update_one({"_id": oid}, {"$set": {"push_user_id": body.push_user_id}})
    if first_time:
        await safe_push([body.push_user_id], {
            "title": f"Order {doc['order_number']} confirmed",
            "message": f"Thank you! Your BioRNA-C patches ({doc['quantity']} box{'es' if doc['quantity'] > 1 else ''}) are being prepared for dispatch.",
            "action_url": f"/order/{order_id}",
        }, idempotency_key=f"order-confirmed-{order_id}")
    doc = await db.orders.find_one({"_id": oid})
    return Order.from_mongo(doc)


@api_router.delete("/orders/{order_id}/reminders", response_model=Order, response_model_by_alias=False)
async def disable_reminders(order_id: str):
    try:
        oid = ObjectId(order_id)
    except (InvalidId, TypeError):
        raise HTTPException(404, "Order not found")
    res = await db.orders.find_one_and_update({"_id": oid}, {"$set": {"reminders_enabled": False}}, return_document=ReturnDocument.AFTER)
    if not res:
        raise HTTPException(404, "Order not found")
    return Order.from_mongo(res)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("startup")
async def ensure_indexes():
    if not await db.counters.find_one({"_id": "orders"}):
        await db.counters.insert_one({"_id": "orders", "seq": await db.orders.count_documents({})})
    await db.orders.create_index("order_number", unique=True)
    asyncio.create_task(reminder_loop(db))


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
