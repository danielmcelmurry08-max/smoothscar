from fastapi import FastAPI, APIRouter, HTTPException
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
    "one_time": {"name": "BioRNA-C · One-time purchase", "unit_price": 300, "min_qty": 1, "max_qty": 10,
                 "interval": None, "allowed_qty": None},
    "subscribe": {"name": "Continuous Scar Care · Subscribe & Save", "unit_price": 270, "min_qty": 1, "max_qty": 4,
                  "interval": "Every 4 weeks", "allowed_qty": None},
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
    plan: Literal["one_time", "subscribe", "clinic"]
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


@api_router.get("/")
async def root():
    return {"message": "BioRNA Antiscar API"}


@api_router.get("/pricing")
async def pricing():
    return {"currency": "SGD", "plans": PLANS}


@api_router.post("/orders", response_model=Order, response_model_by_alias=False)
async def create_order(payload: OrderCreate):
    plan = PLANS[payload.plan]
    if payload.quantity < plan["min_qty"] or payload.quantity > plan["max_qty"]:
        raise HTTPException(400, f"Quantity must be between {plan['min_qty']} and {plan['max_qty']}")
    if plan["allowed_qty"] and payload.quantity not in plan["allowed_qty"]:
        raise HTTPException(400, f"Quantity must be one of {plan['allowed_qty']}")
    if payload.plan == "clinic" and not (payload.customer.clinic_name or "").strip():
        raise HTTPException(400, "Clinic / provider name is required for partner orders")
    subtotal = plan["unit_price"] * payload.quantity
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
        unit_price=plan["unit_price"],
        subtotal=subtotal,
        shipping=shipping,
        total=subtotal + shipping,
        payment_method=payload.payment_method,
        customer=payload.customer,
        created_at=now.isoformat(),
    )
    res = await db.orders.insert_one(order.to_mongo())
    order.id = str(res.inserted_id)
    return order


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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
