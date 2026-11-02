"""Signed-in customers manage their Auto-Ship plans: pause, resume, skip next shipment, change boxes, cancel."""
import re
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from auth import get_current_user
from push_service import SHIP_CYCLE_DAYS, next_ship

ALLOWED_QTY = [2, 4]
UNIT_PRICE = 275


class AutoShipAction(BaseModel):
    action: Literal["pause", "resume", "skip", "change_qty", "cancel"]
    quantity: Optional[int] = None


def _owner_filter(user: dict) -> dict:
    q = [{"user_id": user["user_id"]}]
    if user.get("email"):
        q.append({"customer.email": {"$regex": f"^{re.escape(user['email'])}$", "$options": "i"}})
    return {"$or": q, "plan": "subscribe"}


def _view(o: dict) -> dict:
    status = o.get("autoship_status") or "active"
    return {
        "id": str(o["_id"]),
        "order_number": o["order_number"],
        "status": status,
        "quantity": o["quantity"],
        "unit_price": o.get("unit_price", UNIT_PRICE),
        "per_shipment": o.get("unit_price", UNIT_PRICE) * o["quantity"],
        "next_ship_date": next_ship(o).isoformat() if status == "active" else None,
        "skips_used": o.get("skips_used", 0),
        "shipments_sent": o.get("shipments_sent", 0),
        "created_at": o["created_at"],
    }


def build_router(db) -> APIRouter:
    r = APIRouter(prefix="/api/me/autoships")

    @r.get("")
    async def list_autoships(request: Request):
        user = await get_current_user(db, request)
        docs = await db.orders.find(_owner_filter(user)).sort("_id", -1).to_list(200)
        rank = {"active": 0, "paused": 1, "cancelled": 2}
        docs.sort(key=lambda d: rank.get(d.get("autoship_status") or "active", 0))
        return [_view(d) for d in docs[:50]]

    @r.post("/{order_id}")
    async def update_autoship(order_id: str, body: AutoShipAction, request: Request):
        user = await get_current_user(db, request)
        try:
            oid = ObjectId(order_id)
        except (InvalidId, TypeError):
            raise HTTPException(404, "Auto-Ship not found")
        o = await db.orders.find_one({"_id": oid, **_owner_filter(user)})
        if not o:
            raise HTTPException(404, "Auto-Ship not found")
        status = o.get("autoship_status") or "active"
        if status == "cancelled":
            raise HTTPException(400, "This Auto-Ship has been cancelled")
        now = datetime.now(timezone.utc)
        upd: dict = {}
        inc: dict = {}
        if body.action == "pause":
            if status == "paused":
                raise HTTPException(400, "Auto-Ship is already paused")
            upd = {"autoship_status": "paused", "paused_at": now.isoformat()}
        elif body.action == "resume":
            if status != "paused":
                raise HTTPException(400, "Auto-Ship is not paused")
            nxt = next_ship(o)
            if nxt < now + timedelta(days=2):
                nxt = now + timedelta(days=SHIP_CYCLE_DAYS)
            upd = {"autoship_status": "active", "next_ship_date": nxt.isoformat()}
        elif body.action == "skip":
            if status != "active":
                raise HTTPException(400, "Resume your Auto-Ship before skipping a shipment")
            upd = {"next_ship_date": (next_ship(o) + timedelta(days=SHIP_CYCLE_DAYS)).isoformat()}
            inc = {"skips_used": 1}
        elif body.action == "change_qty":
            if body.quantity not in ALLOWED_QTY:
                raise HTTPException(400, f"Boxes per shipment must be one of {ALLOWED_QTY}")
            unit = o.get("unit_price", UNIT_PRICE)
            upd = {"quantity": body.quantity, "subtotal": unit * body.quantity, "total": unit * body.quantity}
        else:  # cancel
            upd = {"autoship_status": "cancelled", "cancelled_at": now.isoformat(), "reminders_enabled": False}
        mongo_update = {"$set": upd}
        if inc:
            mongo_update["$inc"] = inc
        status_filter = {"autoship_status": {"$in": [None, "active"]}} if status == "active" else {"autoship_status": status}
        res = await db.orders.update_one({"_id": oid, **status_filter}, mongo_update)
        if res.matched_count == 0:
            raise HTTPException(409, "Your Auto-Ship was just updated elsewhere. Please refresh and try again.")
        return _view(await db.orders.find_one({"_id": oid}))

    return r
