"""Verified-buyer reviews (1–5 stars) with optional before/after photos.
New reviews wait for team approval; approval publishes the photos and emails a 25%-off code.
A background loop emails a "rate your results" request 3 weeks after each order."""
import asyncio
import logging
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel, Field

from admin import verify_view_token
from email_service import rate_limited, review_request_email, review_reward_email, send_email
from referrals import REVIEW_PERCENT, issue_review_code
from storage import APP_NAME, get_object, put_object

logger = logging.getLogger(__name__)

REVIEW_REQUEST_AFTER = timedelta(days=21)
MAX_PHOTO_BYTES = 8 * 1024 * 1024
PHOTO_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic"}


class ReviewCreate(BaseModel):
    order_number: str = Field(min_length=6, max_length=30)
    email: str = Field(min_length=5, max_length=200)
    rating: int = Field(ge=1, le=5)
    display_name: str = Field(min_length=2, max_length=40)
    title: Optional[str] = Field(default=None, max_length=80)
    body: str = Field(min_length=10, max_length=1000)
    scar_type: Optional[str] = Field(default=None, max_length=60)
    before_photo_id: Optional[str] = Field(default=None, max_length=40)
    after_photo_id: Optional[str] = Field(default=None, max_length=40)


class OrderLookup(BaseModel):
    order_number: str = Field(min_length=6, max_length=30)
    email: str = Field(min_length=5, max_length=200)


def photo_url(photo_id: Optional[str]) -> Optional[str]:
    return f"/api/photos/{photo_id}" if photo_id else None


def public_view(d: dict) -> dict:
    return {
        "id": str(d["_id"]),
        "display_name": d["display_name"],
        "rating": d["rating"],
        "title": d.get("title"),
        "body": d["body"],
        "scar_type": d.get("scar_type"),
        "created_at": d["created_at"],
        "before_photo_url": photo_url(d.get("before_photo_id")),
        "after_photo_url": photo_url(d.get("after_photo_id")),
    }


async def on_review_approved(db, review: dict) -> None:
    """Publish the review's photos and, the first time only, email the reviewer a 25%-off code."""
    ids = [ObjectId(i) for i in (review.get("before_photo_id"), review.get("after_photo_id")) if i]
    if ids:
        await db.review_photos.update_many({"_id": {"$in": ids}}, {"$set": {"public": True}})
    if review.get("reward_code") not in (None, "pending"):  # "pending" = legacy stuck state, retry
        return
    order = await db.orders.find_one({"order_number": review["order_number"]})
    owner_key = order.get("email_key") if order else review["customer_email"].lower()
    code = await issue_review_code(db, owner_key, str(review["_id"]))  # idempotent per review
    res = await db.reviews.update_one({"_id": review["_id"], "reward_code": {"$ne": code}},
                                      {"$set": {"reward_code": code, "reward_email_status": "sending"}})
    if res.modified_count:
        asyncio.create_task(_send_reward(db, review, code))


async def _send_reward(db, review: dict, code: str) -> None:
    subject, html = review_reward_email(review["display_name"], code, REVIEW_PERCENT)
    status = await send_email(to=review["customer_email"], subject=subject, html=html)
    await db.reviews.update_one({"_id": review["_id"]}, {"$set": {"reward_email_status": status}})


async def on_review_hidden(db, review: dict) -> None:
    ids = [ObjectId(i) for i in (review.get("before_photo_id"), review.get("after_photo_id")) if i]
    if ids:
        await db.review_photos.update_many({"_id": {"$in": ids}}, {"$set": {"public": False}})


async def review_request_loop(db) -> None:
    while True:
        try:
            cutoff = (datetime.now(timezone.utc) - REVIEW_REQUEST_AFTER).isoformat()
            async for o in db.orders.find({"created_at": {"$lte": cutoff}, "review_request_status": {"$exists": False}}).limit(50):
                if await db.reviews.find_one({"order_number": o["order_number"]}):
                    await db.orders.update_one({"_id": o["_id"]}, {"$set": {"review_request_status": "skipped:reviewed"}})
                    continue
                claimed = await db.orders.update_one(
                    {"_id": o["_id"], "review_request_status": {"$exists": False}}, {"$set": {"review_request_status": "sending"}}
                )
                if not claimed.modified_count:
                    continue
                subject, html = review_request_email(o, REVIEW_PERCENT)
                status = await send_email(to=o["customer"]["email"], subject=subject, html=html)
                await db.orders.update_one({"_id": o["_id"]}, {"$set": {
                    "review_request_status": status, "review_request_at": datetime.now(timezone.utc).isoformat()}})
        except Exception as e:
            logger.error(f"Review request loop error: {e}")
        await asyncio.sleep(1800)


def build_router(db, client_ip, email_key) -> APIRouter:
    r = APIRouter(prefix="/api")

    async def find_order(order_number: str, email: str) -> dict:
        number = order_number.strip().upper()
        order = await db.orders.find_one({"order_number": {"$regex": f"^{re.escape(number)}$", "$options": "i"}})
        if not order or order.get("email_key") != email_key(email.strip()):
            raise HTTPException(400, "We couldn't find an order with that order number and email.")
        return order

    async def order_by_id(order_id: str) -> dict:
        try:
            order = await db.orders.find_one({"_id": ObjectId(order_id)})
        except (InvalidId, TypeError):
            order = None
        if not order:
            raise HTTPException(404, "Order not found")
        return order

    async def store_photo(order: dict, kind: str, file: UploadFile) -> dict:
        ctype = (file.content_type or "").lower()
        if ctype not in PHOTO_TYPES:
            raise HTTPException(400, "Please upload a JPG, PNG, WEBP or HEIC photo.")
        data = await file.read(MAX_PHOTO_BYTES + 1)
        if len(data) > MAX_PHOTO_BYTES:
            raise HTTPException(413, "That photo is too large. Please use one under 8 MB.")
        path = f"{APP_NAME}/review-photos/{order['_id']}/{uuid.uuid4().hex}.{PHOTO_TYPES[ctype]}"
        try:
            res = await run_in_threadpool(put_object, path, data, ctype)
        except Exception as e:
            code = getattr(getattr(e, "response", None), "status_code", None)
            logger.error(f"Photo upload failed: {code} {e}")
            raise HTTPException(503, "We couldn't save your photo right now. Please try again later.")
        doc = {"order_id": str(order["_id"]), "order_number": order["order_number"], "kind": kind, "storage_path": res["path"],
               "content_type": ctype, "size": len(data), "public": False, "created_at": datetime.now(timezone.utc).isoformat()}
        ins = await db.review_photos.insert_one(doc)
        if kind == "before":
            await db.orders.update_one({"_id": order["_id"]}, {"$set": {"before_photo_id": str(ins.inserted_id)}})
        return {"id": str(ins.inserted_id), "kind": kind}

    @r.get("/reviews")
    async def list_reviews():
        approved = {"status": "approved"}
        dist = {str(i): 0 for i in range(1, 6)}
        async for row in db.reviews.aggregate([{"$match": approved}, {"$group": {"_id": "$rating", "n": {"$sum": 1}}}]):
            dist[str(row["_id"])] = row["n"]
        count = sum(dist.values())
        average = round(sum(int(k) * v for k, v in dist.items()) / count, 1) if count else None
        docs = await db.reviews.find(approved).sort("approved_at", -1).limit(30).to_list(30)
        return {"average": average, "count": count, "distribution": dist, "reviews": [public_view(d) for d in docs]}

    @r.post("/reviews", status_code=201)
    async def create_review(body: ReviewCreate, request: Request):
        if rate_limited(f"review:{client_ip(request)}", 10):
            raise HTTPException(429, "Too many attempts. Please try again later.")
        order = await find_order(body.order_number, body.email)
        if await db.reviews.find_one({"order_number": order["order_number"]}):
            raise HTTPException(409, "A review has already been submitted for this order.")
        for pid, kind in ((body.before_photo_id, "before"), (body.after_photo_id, "after")):
            if not pid:
                continue
            try:
                ok = await db.review_photos.find_one({"_id": ObjectId(pid), "order_id": str(order["_id"]), "kind": kind})
            except (InvalidId, TypeError):
                ok = None
            if not ok:
                raise HTTPException(400, f"The {kind} photo doesn't belong to this order. Please upload it again.")
        doc = {
            "order_number": order["order_number"],
            "order_id": str(order["_id"]),
            "customer_email": order["customer"]["email"],
            "rating": body.rating,
            "display_name": body.display_name.strip(),
            "title": (body.title or "").strip() or None,
            "body": body.body.strip(),
            "scar_type": (body.scar_type or "").strip() or None,
            "before_photo_id": body.before_photo_id,
            "after_photo_id": body.after_photo_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            await db.reviews.insert_one(doc)
        except Exception:
            raise HTTPException(409, "A review has already been submitted for this order.")
        return {"status": "pending"}

    @r.post("/reviews/lookup")
    async def lookup_order(body: OrderLookup, request: Request):
        """Lets the review form show the before photo taken after purchase."""
        if rate_limited(f"review-lookup:{client_ip(request)}", 30):
            raise HTTPException(429, "Too many attempts. Please try again later.")
        order = await find_order(body.order_number, body.email)
        token = order.get("photo_token")
        if not token:
            token = secrets.token_urlsafe(16)
            await db.orders.update_one({"_id": order["_id"]}, {"$set": {"photo_token": token}})
        return {"photo_token": token, "before_photo_id": order.get("before_photo_id")}

    @r.post("/review-photos", status_code=201)
    async def upload_review_photo(request: Request, order_number: str = Form(...), email: str = Form(...),
                                  kind: Literal["before", "after"] = Form(...), file: UploadFile = File(...)):
        if rate_limited(f"photo:{client_ip(request)}", 20):
            raise HTTPException(429, "Too many uploads. Please try again later.")
        order = await find_order(order_number, email)
        return await store_photo(order, kind, file)

    @r.post("/orders/{order_id}/before-photo", status_code=201)
    async def upload_before_photo(order_id: str, request: Request, token: str = Form(...), file: UploadFile = File(...)):
        if rate_limited(f"photo:{client_ip(request)}", 20):
            raise HTTPException(429, "Too many uploads. Please try again later.")
        order = await order_by_id(order_id)
        if not order.get("photo_token") or not secrets.compare_digest(token.encode(), order["photo_token"].encode()):
            raise HTTPException(403, "This link can't add photos to the order. Use the review form instead.")
        return await store_photo(order, "before", file)

    @r.get("/photos/{photo_id}")
    async def get_photo(photo_id: str, token: Optional[str] = None, admin_token: Optional[str] = None):
        try:
            photo = await db.review_photos.find_one({"_id": ObjectId(photo_id)})
        except (InvalidId, TypeError):
            photo = None
        if not photo:
            raise HTTPException(404, "Photo not found")
        allowed = bool(photo.get("public")) or (admin_token is not None and verify_view_token(admin_token))
        if not allowed and token:
            order = await db.orders.find_one({"_id": ObjectId(photo["order_id"])}, {"photo_token": 1})
            allowed = bool(order and order.get("photo_token") and secrets.compare_digest(token.encode(), order["photo_token"].encode()))
        if not allowed:
            raise HTTPException(404, "Photo not found")
        data, ctype = await run_in_threadpool(get_object, photo["storage_path"])
        cache = "public, max-age=86400" if photo.get("public") else "private, max-age=3600"
        return Response(content=data, media_type=photo.get("content_type") or ctype, headers={"Cache-Control": cache})

    return r
