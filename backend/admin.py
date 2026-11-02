"""Team admin (passcode): orders dashboard, review moderation and live pricing."""
import os
import secrets
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Literal

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator

from email_service import rate_limited
from pricing import get_prices, set_prices
from push_service import next_ship

ADMIN_PASSCODE = os.environ["ADMIN_PASSCODE"]
SGT = timezone(timedelta(hours=8))


def check_admin(request: Request, ip: str) -> None:
    supplied = request.headers.get("x-admin-passcode", "")
    if not secrets.compare_digest(supplied.encode(), ADMIN_PASSCODE.encode()):
        if rate_limited(f"admin-fail:{ip}", 10):
            raise HTTPException(429, "Too many attempts. Please try again later.")
        raise HTTPException(401, "Incorrect passcode")


def sg_region(postal: str) -> str:
    """Singapore region from the first two digits (postal sector) of a 6-digit postal code."""
    digits = "".join(ch for ch in postal if ch.isdigit())
    if len(digits) != 6:
        return "Unknown"
    s = int(digits[:2])
    if 1 <= s <= 41:
        return "Central"
    if 42 <= s <= 52 or s == 81:
        return "East"
    if 53 <= s <= 57 or s == 82:
        return "North-East"
    if 58 <= s <= 71:
        return "West"
    if 72 <= s <= 80:
        return "North"
    return "Unknown"


def time_slot(hour: int) -> str:
    if 6 <= hour < 12:
        return "Morning"
    if 12 <= hour < 18:
        return "Afternoon"
    if 18 <= hour < 24:
        return "Evening"
    return "Overnight"


class PricesUpdate(BaseModel):
    single: int = Field(ge=1, le=5000)
    bundle: int = Field(ge=1, le=5000)
    autoship: int = Field(ge=1, le=5000)

    @model_validator(mode="after")
    def bundle_not_above_single(self):
        if self.bundle > self.single:
            raise ValueError("The 2-box bundle price per box can't be higher than the single-box price")
        return self


class ReviewDecision(BaseModel):
    status: Literal["approved", "rejected", "pending"]


def build_router(db, client_ip) -> APIRouter:
    r = APIRouter(prefix="/api/admin")

    async def guard(request: Request):
        check_admin(request, client_ip(request))

    @r.get("/orders")
    async def admin_orders(request: Request, days: int = 0):
        await guard(request)
        q = {}
        if days > 0:
            q["created_at"] = {"$gte": (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()}
        docs = await db.orders.find(q).sort("_id", -1).limit(1000).to_list(1000)
        user_ids = list({d["user_id"] for d in docs if d.get("user_id")})
        users = {u["user_id"]: u async for u in db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "name": 1, "email": 1, "provider": 1})}
        rows, regions, slots, hours, plans, customers = [], Counter(), Counter(), [0] * 24, Counter(), set()
        region_boxes = Counter()
        revenue = boxes = signed_in = active_auto = 0
        for d in docs:
            created = datetime.fromisoformat(d["created_at"]).astimezone(SGT)
            region = sg_region(d["customer"]["postal_code"])
            slot = time_slot(created.hour)
            is_sub = d["plan"] == "subscribe"
            auto_status = (d.get("autoship_status") or "active") if is_sub else None
            u = users.get(d.get("user_id"))
            rows.append({
                "id": str(d["_id"]),
                "order_number": d["order_number"],
                "created_at": d["created_at"],
                "sgt_time": created.strftime("%d %b %Y, %H:%M"),
                "time_slot": slot,
                "plan": d["plan"],
                "plan_name": d["plan_name"],
                "quantity": d["quantity"],
                "unit_price": d["unit_price"],
                "total": d["total"],
                "discount": d.get("discount", 0),
                "applied_code": d.get("applied_code"),
                "payment_method": d["payment_method"],
                "customer": d["customer"],
                "region": region,
                "account": {"user_id": u["user_id"], "name": u.get("name"), "email": u.get("email"), "provider": u.get("provider")} if u else None,
                "autoship_status": auto_status,
                "next_ship_date": next_ship(d).isoformat() if auto_status == "active" else None,
                "shipments_sent": d.get("shipments_sent", 0) if is_sub else None,
            })
            revenue += d["total"]
            boxes += d["quantity"]
            regions[region] += 1
            region_boxes[region] += d["quantity"]
            slots[slot] += 1
            hours[created.hour] += 1
            plans[d["plan"]] += 1
            customers.add(d.get("email_key") or d["customer"]["email"].lower())
            signed_in += 1 if u else 0
            active_auto += 1 if auto_status == "active" else 0
        n = len(docs)
        stats = {
            "orders": n,
            "revenue": revenue,
            "boxes": boxes,
            "average_order": round(revenue / n) if n else 0,
            "unique_customers": len(customers),
            "signed_in_orders": signed_in,
            "active_autoships": active_auto,
            "by_region": [{"region": k, "orders": v, "boxes": region_boxes[k]} for k, v in regions.most_common()],
            "by_time_slot": [{"slot": s, "orders": slots[s]} for s in ("Morning", "Afternoon", "Evening", "Overnight")],
            "by_hour": hours,
            "peak_hour": max(range(24), key=lambda h: hours[h]) if n else None,
            "by_plan": dict(plans),
        }
        return {"orders": rows, "stats": stats}

    @r.get("/pricing")
    async def admin_get_pricing(request: Request):
        await guard(request)
        return await get_prices(db)

    @r.put("/pricing")
    async def admin_set_pricing(body: PricesUpdate, request: Request):
        await guard(request)
        return await set_prices(db, body.model_dump())

    @r.get("/reviews")
    async def admin_reviews(request: Request, status: str = "pending"):
        await guard(request)
        q = {} if status == "all" else {"status": status}
        docs = await db.reviews.find(q).sort("_id", -1).limit(200).to_list(200)
        return [{
            "id": str(d["_id"]), "order_number": d["order_number"], "customer_email": d["customer_email"],
            "rating": d["rating"], "display_name": d["display_name"], "title": d.get("title"), "body": d["body"],
            "scar_type": d.get("scar_type"), "status": d["status"], "created_at": d["created_at"],
        } for d in docs]

    @r.post("/reviews/{review_id}")
    async def admin_decide_review(review_id: str, body: ReviewDecision, request: Request):
        await guard(request)
        try:
            oid = ObjectId(review_id)
        except (InvalidId, TypeError):
            raise HTTPException(404, "Review not found")
        upd = {"status": body.status}
        if body.status == "approved":
            upd["approved_at"] = datetime.now(timezone.utc).isoformat()
        res = await db.reviews.update_one({"_id": oid}, {"$set": upd})
        if res.matched_count == 0:
            raise HTTPException(404, "Review not found")
        return {"id": review_id, "status": body.status}

    return r
