"""Live prices (SGD per box), editable by the team from /admin. Stored in db.settings {_id: "pricing"}."""
from datetime import datetime, timezone

DEFAULT_PRICES = {"single": 300, "bundle": 275, "autoship": 275}


async def get_prices(db) -> dict:
    doc = await db.settings.find_one({"_id": "pricing"}) or {}
    return {k: int(doc.get(k, v)) for k, v in DEFAULT_PRICES.items()}


async def set_prices(db, prices: dict) -> dict:
    await db.settings.update_one(
        {"_id": "pricing"},
        {"$set": {**prices, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return await get_prices(db)


def build_plans(p: dict) -> dict:
    return {
        "one_time": {"name": "BioRNA-C · One-time purchase", "unit_price": p["single"], "bundle_price": p["bundle"],
                     "min_qty": 1, "max_qty": 10, "interval": None, "allowed_qty": None},
        "subscribe": {"name": "Auto-Ship · Every 2 Weeks", "unit_price": p["autoship"], "min_qty": 2, "max_qty": 4,
                      "interval": "Every 2 weeks", "allowed_qty": [2, 4]},
    }
