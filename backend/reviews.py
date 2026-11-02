"""Verified-buyer reviews (1–5 stars). New reviews wait for team approval before appearing publicly."""
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from email_service import rate_limited


class ReviewCreate(BaseModel):
    order_number: str = Field(min_length=6, max_length=30)
    email: str = Field(min_length=5, max_length=200)
    rating: int = Field(ge=1, le=5)
    display_name: str = Field(min_length=2, max_length=40)
    title: Optional[str] = Field(default=None, max_length=80)
    body: str = Field(min_length=10, max_length=1000)
    scar_type: Optional[str] = Field(default=None, max_length=60)


def public_view(d: dict) -> dict:
    return {
        "id": str(d["_id"]),
        "display_name": d["display_name"],
        "rating": d["rating"],
        "title": d.get("title"),
        "body": d["body"],
        "scar_type": d.get("scar_type"),
        "created_at": d["created_at"],
    }


def build_router(db, client_ip, email_key) -> APIRouter:
    r = APIRouter(prefix="/api/reviews")

    @r.get("")
    async def list_reviews():
        approved = {"status": "approved"}
        dist = {str(i): 0 for i in range(1, 6)}
        async for row in db.reviews.aggregate([{"$match": approved}, {"$group": {"_id": "$rating", "n": {"$sum": 1}}}]):
            dist[str(row["_id"])] = row["n"]
        count = sum(dist.values())
        average = round(sum(int(k) * v for k, v in dist.items()) / count, 1) if count else None
        docs = await db.reviews.find(approved).sort("approved_at", -1).limit(30).to_list(30)
        return {"average": average, "count": count, "distribution": dist, "reviews": [public_view(d) for d in docs]}

    @r.post("", status_code=201)
    async def create_review(body: ReviewCreate, request: Request):
        if rate_limited(f"review:{client_ip(request)}", 10):
            raise HTTPException(429, "Too many attempts. Please try again later.")
        number = body.order_number.strip().upper()
        order = await db.orders.find_one({"order_number": {"$regex": f"^{re.escape(number)}$", "$options": "i"}})
        if not order or order.get("email_key") != email_key(body.email.strip()):
            raise HTTPException(400, "We couldn't find an order with that order number and email.")
        if await db.reviews.find_one({"order_number": order["order_number"]}):
            raise HTTPException(409, "A review has already been submitted for this order.")
        doc = {
            "order_number": order["order_number"],
            "order_id": str(order["_id"]),
            "customer_email": order["customer"]["email"],
            "rating": body.rating,
            "display_name": body.display_name.strip(),
            "title": (body.title or "").strip() or None,
            "body": body.body.strip(),
            "scar_type": (body.scar_type or "").strip() or None,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            await db.reviews.insert_one(doc)
        except Exception:
            raise HTTPException(409, "A review has already been submitted for this order.")
        return {"status": "pending"}

    return r
