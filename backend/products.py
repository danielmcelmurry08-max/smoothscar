"""BioRNA pack catalogue ("More BioRNA packs"), managed from the team portal. Seeded from biorna.sg/shop."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel, Field

from admin import check_admin
from storage import APP_NAME, get_object, put_object

WIX = "https://static.wixstatic.com/media/"
SEED = [
    ("BioRNA-K", 1, 50, "Single micro-tips patch for a small keloid. A simple way to try BioRNA.", "NEW ARRIVAL",
     WIX + "c38d70_e23a93f616af4d849e51f8aaf7ff7c48~mv2.png"),
    ("BioRNA-C Starter Pack", 2, 228, "Two patches to get started on a new or small scar.", "SOFT LAUNCH",
     WIX + "c38d70_f4026a393d6547ccbf2a07ba8d34201e~mv2.png"),
    ("BioRNA-C Standard Pack", 8, 856, "Eight patches for a longer course of nightly care.", "SOFT LAUNCH",
     WIX + "c38d70_bf1c138473724e67b819b1be4d5961fd~mv2.png"),
    ("BioRNA-C Gift Pack (Baby Girl)", 24, 1998, "A 24-patch gift box for new mothers after a C-section.", "SOFT LAUNCH",
     WIX + "c38d70_d440f3d46c9e414694257762e5fbe7af~mv2.png"),
    ("BioRNA-C Gift Pack (Baby Boy)", 24, 1998, "A 24-patch gift box for new mothers after a C-section.", "SOFT LAUNCH",
     WIX + "c38d70_2b6c2576e32c484fadc3d63d48e2852f~mv2.png"),
]
IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    patches: int = Field(ge=1, le=200)
    price: int = Field(ge=1, le=20000)
    description: Optional[str] = Field(default=None, max_length=300)
    badge: Optional[str] = Field(default=None, max_length=20)
    image_url: Optional[str] = Field(default=None, max_length=500)
    active: bool = True
    sort: int = 0


def view(d: dict) -> dict:
    image = f"/api/product-images/{d['_id']}" if d.get("image_path") else d.get("image_url")
    return {"id": str(d["_id"]), "name": d["name"], "patches": d["patches"], "price": d["price"],
            "description": d.get("description"), "badge": d.get("badge"), "image_url": d.get("image_url"),
            "image": image, "active": d.get("active", True), "sort": d.get("sort", 0)}


async def seed_products(db) -> None:
    if await db.settings.find_one({"_id": "products_seeded"}):
        return
    now = datetime.now(timezone.utc).isoformat()
    await db.products.insert_many([
        {"name": n, "patches": p, "price": pr, "description": ds, "badge": b, "image_url": img, "active": True, "sort": i, "created_at": now}
        for i, (n, p, pr, ds, b, img) in enumerate(SEED)
    ])
    await db.settings.insert_one({"_id": "products_seeded", "at": now})


async def get_product(db, product_id: str, active_only: bool = True) -> dict:
    try:
        doc = await db.products.find_one({"_id": ObjectId(product_id), "deleted": {"$ne": True}})
    except (InvalidId, TypeError):
        doc = None
    if not doc or (active_only and not doc.get("active", True)):
        raise HTTPException(404, "This product is no longer available")
    return doc


def build_router(db, client_ip) -> APIRouter:
    r = APIRouter(prefix="/api")

    def guard(request: Request):
        check_admin(request, client_ip(request))

    @r.get("/products")
    async def list_products():
        docs = await db.products.find({"active": True, "deleted": {"$ne": True}}).sort([("sort", 1), ("_id", 1)]).to_list(100)
        return [view(d) for d in docs]

    @r.get("/products/{product_id}")
    async def one_product(product_id: str):
        return view(await get_product(db, product_id))

    @r.get("/product-images/{product_id}")
    async def product_image(product_id: str):
        doc = await get_product(db, product_id, active_only=False)
        if not doc.get("image_path"):
            raise HTTPException(404, "No image")
        data, ctype = await run_in_threadpool(get_object, doc["image_path"])
        return Response(content=data, media_type=doc.get("image_type") or ctype, headers={"Cache-Control": "public, max-age=86400"})

    @r.get("/admin/products")
    async def admin_list(request: Request):
        guard(request)
        docs = await db.products.find({"deleted": {"$ne": True}}).sort([("sort", 1), ("_id", 1)]).to_list(200)
        return [view(d) for d in docs]

    @r.post("/admin/products", status_code=201)
    async def admin_create(body: ProductIn, request: Request):
        guard(request)
        doc = {**body.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
        last = await db.products.find_one({}, sort=[("sort", -1)])
        doc["sort"] = (last.get("sort", 0) + 1) if last else 0
        res = await db.products.insert_one(doc)
        doc["_id"] = res.inserted_id
        return view(doc)

    @r.put("/admin/products/{product_id}")
    async def admin_update(product_id: str, body: ProductIn, request: Request):
        guard(request)
        doc = await get_product(db, product_id, active_only=False)
        await db.products.update_one({"_id": doc["_id"]}, {"$set": body.model_dump()})
        return view(await db.products.find_one({"_id": doc["_id"]}))

    @r.delete("/admin/products/{product_id}")
    async def admin_delete(product_id: str, request: Request):
        guard(request)
        doc = await get_product(db, product_id, active_only=False)
        await db.products.update_one({"_id": doc["_id"]}, {"$set": {"deleted": True, "active": False}})
        return {"id": product_id, "deleted": True}

    @r.post("/admin/products/{product_id}/image")
    async def admin_image(product_id: str, request: Request, file: UploadFile = File(...)):
        guard(request)
        doc = await get_product(db, product_id, active_only=False)
        ctype = (file.content_type or "").lower()
        if ctype not in IMAGE_TYPES:
            raise HTTPException(400, "Please upload a JPG, PNG or WEBP image.")
        data = await file.read(8 * 1024 * 1024 + 1)
        if len(data) > 8 * 1024 * 1024:
            raise HTTPException(413, "That image is too large. Please use one under 8 MB.")
        try:
            res = await run_in_threadpool(put_object, f"{APP_NAME}/products/{uuid.uuid4().hex}.{IMAGE_TYPES[ctype]}", data, ctype)
        except Exception:
            raise HTTPException(503, "We couldn't save the image right now. Please try again later.")
        await db.products.update_one({"_id": doc["_id"]}, {"$set": {"image_path": res["path"], "image_type": ctype}})
        return view(await db.products.find_one({"_id": doc["_id"]}))

    return r
