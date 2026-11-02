"""Referral program: friend gets $25 off first order; referrer earns a free-box code for every 3 friends who buy."""
import secrets
from datetime import datetime, timezone

from fastapi import HTTPException
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
REFERRAL_PREFIX = "BIO"
REWARD_PREFIX = "FREE"
REVIEW_PREFIX = "RVW"
REVIEW_PERCENT = 25
FRIEND_DISCOUNT = 25
FRIENDS_PER_REWARD = 3


def _gen(prefix: str) -> str:
    return prefix + "".join(secrets.choice(ALPHABET) for _ in range(6))


def normalize(code: str) -> str:
    return "".join(ch for ch in code.upper() if ch.isalnum())


async def ensure_referral_code(db, owner_key: str, owner_email: str, order_id: str) -> str:
    existing = await db.referrals.find_one({"owner_key": owner_key})
    if existing:
        return existing["code"]
    for _ in range(5):
        code = _gen(REFERRAL_PREFIX)
        try:
            await db.referrals.insert_one({
                "code": code, "owner_key": owner_key, "owner_email": owner_email, "first_order_id": order_id,
                "successful_orders": [], "successful_count": 0, "rewards_issued": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            return code
        except DuplicateKeyError:
            existing = await db.referrals.find_one({"owner_key": owner_key})
            if existing:  # concurrent first order created it
                return existing["code"]
            continue  # code collision, retry
    raise HTTPException(500, "Could not create referral code")


async def issue_review_code(db, owner_key: str, review_id: str) -> str:
    """One code per review (unique index on review_id); returns the existing code on repeat calls."""
    for _ in range(5):
        existing = await db.reward_codes.find_one({"review_id": review_id})
        if existing:
            return existing["code"]
        code = _gen(REVIEW_PREFIX)
        try:
            await db.reward_codes.insert_one({
                "code": code, "kind": "review", "owner_key": owner_key, "review_id": review_id, "used": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            return code
        except DuplicateKeyError:
            continue
    raise HTTPException(500, "Could not create review code")


def review_discount(msrp: int, subtotal: int) -> int:
    return min(round(msrp * REVIEW_PERCENT / 100), subtotal)


async def preview_code(db, raw: str) -> dict:
    code = normalize(raw)
    if code.startswith(REVIEW_PREFIX):
        doc = await db.reward_codes.find_one({"code": code, "kind": "review"})
        if not doc or doc.get("used"):
            raise HTTPException(404, "This review code is invalid or already used")
        return {"code": code, "kind": "review", "label": f"{REVIEW_PERCENT}% off one box", "percent": REVIEW_PERCENT}
    if code.startswith(REWARD_PREFIX):
        doc = await db.reward_codes.find_one({"code": code})
        if not doc or doc.get("used"):
            raise HTTPException(404, "This reward code is invalid or already used")
        return {"code": code, "kind": "reward", "label": "1 free box"}
    if code.startswith(REFERRAL_PREFIX) and await db.referrals.find_one({"code": code}):
        return {"code": code, "kind": "referral", "label": f"${FRIEND_DISCOUNT} off your first order"}
    raise HTTPException(404, "Code not found")


async def apply_code(db, raw: str, customer_key: str, unit_price: int, subtotal: int, msrp: int = 0) -> tuple[str, str, int, dict]:
    """Validates + reserves the code. Returns (code, kind, discount, doc)."""
    code = normalize(raw)
    if code.startswith(REVIEW_PREFIX):
        doc = await db.reward_codes.find_one_and_update(
            {"code": code, "kind": "review", "used": False},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}},
            return_document=ReturnDocument.AFTER,
        )
        if not doc:
            raise HTTPException(400, "This review code is invalid or already used")
        return code, "review", review_discount(msrp, subtotal), doc
    if code.startswith(REWARD_PREFIX):
        doc = await db.reward_codes.find_one_and_update(
            {"code": code, "used": False},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}},
            return_document=ReturnDocument.AFTER,
        )
        if not doc:
            raise HTTPException(400, "This reward code is invalid or already used")
        return code, "reward", min(unit_price, subtotal), doc
    doc = await db.referrals.find_one({"code": code}) if code.startswith(REFERRAL_PREFIX) else None
    if not doc:
        raise HTTPException(400, "Code not found")
    if doc["owner_key"] == customer_key:
        raise HTTPException(400, "You can't use your own referral code — share it with a friend instead")
    if await db.orders.count_documents({"email_key": customer_key}) > 0:
        raise HTTPException(400, "Referral discounts are for a friend's first order only")
    try:  # atomic one-claim-per-customer guard against parallel first orders
        await db.referral_claims.insert_one({"customer_key": customer_key, "code": code, "created_at": datetime.now(timezone.utc).isoformat()})
    except DuplicateKeyError:
        raise HTTPException(400, "Referral discounts are for a friend's first order only")
    return code, "referral", min(FRIEND_DISCOUNT, subtotal), doc


async def release_claim(db, customer_key: str) -> None:
    await db.referral_claims.delete_one({"customer_key": customer_key})


async def release_reward(db, code: str) -> None:
    await db.reward_codes.update_one({"code": code}, {"$set": {"used": False}, "$unset": {"used_at": ""}})


async def record_referral(db, code: str, order_id: str) -> dict | None:
    """Credits the referrer. Returns {'owner_email', 'owner_key', 'reward_code'} when a reward was just earned."""
    doc = await db.referrals.find_one_and_update(
        {"code": code, "successful_orders": {"$ne": order_id}},
        {"$push": {"successful_orders": order_id}, "$inc": {"successful_count": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if not doc or doc["successful_count"] % FRIENDS_PER_REWARD != 0:
        return None
    reward = _gen(REWARD_PREFIX)
    await db.reward_codes.insert_one({
        "code": reward, "owner_key": doc["owner_key"], "referral_code": code, "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.referrals.update_one({"_id": doc["_id"]}, {"$inc": {"rewards_issued": 1}, "$push": {"reward_codes": reward}})
    return {"owner_email": doc["owner_email"], "owner_key": doc["owner_key"], "reward_code": reward}


async def referral_status(db, code: str) -> dict:
    doc = await db.referrals.find_one({"code": normalize(code)})
    if not doc:
        raise HTTPException(404, "Code not found")
    count = doc.get("successful_count", 0)
    return {
        "code": doc["code"],
        "successful_count": count,
        "friends_to_next_reward": FRIENDS_PER_REWARD - (count % FRIENDS_PER_REWARD),
        "rewards_earned": doc.get("rewards_issued", 0),
        "friend_discount": FRIEND_DISCOUNT,
        "friends_per_reward": FRIENDS_PER_REWARD,
    }
