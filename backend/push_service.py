"""Emergent managed push notifications (SuprSend relay) + nightly / reorder reminder scheduler."""
import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

PUSH_BASE_URL = "https://integrations.emergentagent.com"
PUSH_KEY = os.environ["EMERGENT_PUSH_KEY"]
SGT = ZoneInfo("Asia/Singapore")
NIGHTLY_HOUR, NIGHTLY_MINUTE = 21, 30
PATCHES_PER_BOX = 7
SHIP_CYCLE_DAYS = 14

_client = httpx.AsyncClient(base_url=PUSH_BASE_URL, headers={"X-Push-Key": PUSH_KEY}, timeout=10.0)


async def register_device(body: dict) -> None:
    resp = await _client.post("/api/v1/push/users/register", json=body)
    if resp.status_code == 401:
        raise HTTPException(500, "EMERGENT_PUSH_KEY missing or invalid")
    if resp.status_code >= 500:
        raise HTTPException(502, "Push provider unavailable")
    resp.raise_for_status()


async def send_push(recipients: list[str], data: dict, idempotency_key: str | None = None, _attempt: int = 0) -> None:
    if not recipients:
        return
    if len(recipients) > 100:
        raise ValueError("max 100 recipients per /trigger call; chunk before sending")
    if "title" not in data or "message" not in data:
        raise ValueError("data must include title and message")
    payload: dict = {"recipients": recipients, "data": data}
    if idempotency_key:
        payload["$idempotency_key"] = idempotency_key
    resp = await _client.post("/api/v1/push/trigger", json=payload)
    if resp.status_code == 401:
        raise HTTPException(500, "EMERGENT_PUSH_KEY missing or invalid")
    code = resp.json().get("code", "") if resp.headers.get("content-type", "").startswith("application/json") else ""
    if code == "idempotency_key_in_progress" and idempotency_key and _attempt < 3:
        await asyncio.sleep(3)
        return await send_push(recipients, data, idempotency_key=idempotency_key, _attempt=_attempt + 1)
    if code in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
        logger.warning(f"Push paused: {code} ({resp.status_code}): {resp.json().get('message', '')}")
        return
    if resp.status_code >= 500:
        raise HTTPException(502, "Push provider unavailable")
    resp.raise_for_status()


async def safe_push(recipients: list[str], data: dict, idempotency_key: str | None = None) -> bool:
    try:
        await send_push(recipients, data, idempotency_key)
        return True
    except Exception as e:
        logger.warning(f"Push failed (non-blocking): {e}")
        return False


def _due_reminders(order: dict, now: datetime) -> list[tuple[str, dict, str]]:
    """Returns [(kind, data, idempotency_key)] due for this order right now."""
    out = []
    started = datetime.fromisoformat(order["reminders_started_at"])
    local = now.astimezone(SGT)
    day_index = (local.date() - started.astimezone(SGT).date()).days
    today = local.date().isoformat()
    is_sub = order["plan"] == "subscribe"
    regimen_days = order["quantity"] * PATCHES_PER_BOX
    in_regimen = is_sub or day_index < regimen_days
    after_nightly_time = (local.hour, local.minute) >= (NIGHTLY_HOUR, NIGHTLY_MINUTE)

    if in_regimen and after_nightly_time and order.get("last_nightly_date") != today and day_index >= 0:
        out.append(("nightly", {
            "title": "Time for tonight's BioRNA patch",
            "message": "Clean and dry the skin, apply your patch and press for 30 seconds. Leave on 8–12 hours.",
            "action_url": "/",
        }, f"nightly-{order['_id']}-{today}"))

    if is_sub:
        cycle = day_index // SHIP_CYCLE_DAYS
        if day_index % SHIP_CYCLE_DAYS >= SHIP_CYCLE_DAYS - 2 and order.get("ship_notice_cycle", -1) < cycle:
            out.append(("ship", {
                "title": "Your next BioRNA shipment is on its way soon",
                "message": f"{order['quantity']} boxes ship in 2 days with your auto-ship plan.",
                "action_url": f"/order/{order['_id']}",
            }, f"ship-{order['_id']}-{cycle}"))
    elif not order.get("reorder_sent") and day_index >= regimen_days - 2:
        out.append(("reorder", {
            "title": "Running low on patches",
            "message": "You have about 2 nights of BioRNA patches left. Reorder now to keep your scar care going.",
            "action_url": "/",
        }, f"reorder-{order['_id']}"))
    return out


async def reminder_loop(db) -> None:
    retry_after: dict[str, datetime] = {}
    while True:
        try:
            now = datetime.now(timezone.utc)
            async for order in db.orders.find({"reminders_enabled": True, "push_user_id": {"$exists": True}}):
                for kind, data, key in _due_reminders(order, now):
                    if retry_after.get(key, now) > now:
                        continue
                    ok = await safe_push([order["push_user_id"]], data, idempotency_key=key)
                    if not ok:
                        retry_after[key] = now + timedelta(minutes=30)
                        continue
                    retry_after.pop(key, None)
                    if kind == "nightly":
                        upd = {"last_nightly_date": now.astimezone(SGT).date().isoformat()}
                    elif kind == "reorder":
                        upd = {"reorder_sent": True}
                    else:
                        started = datetime.fromisoformat(order["reminders_started_at"])
                        upd = {"ship_notice_cycle": (now.astimezone(SGT).date() - started.astimezone(SGT).date()).days // SHIP_CYCLE_DAYS}
                    await db.orders.update_one({"_id": order["_id"]}, {"$set": upd})
        except Exception as e:
            logger.error(f"Reminder loop error: {e}")
        await asyncio.sleep(60)


def reminders_started_now() -> str:
    return datetime.now(timezone.utc).isoformat()


__all__ = ["register_device", "safe_push", "reminder_loop", "reminders_started_now", "timedelta"]
