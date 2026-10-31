# Referral program (BIO codes, $25 friend discount, FREE reward every 3 friends) + admin applications API tests
import os
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
ENV = dotenv_values(Path(__file__).resolve().parents[1] / ".env")
ADMIN_PASSCODE = ENV["ADMIN_PASSCODE"]
UID = uuid.uuid4().hex[:8]
REF_LOCAL = f"testref{UID}"
REF_EMAIL = f"{REF_LOCAL}@example.com"
REF_VARIANT = f"test.ref{UID}+alias@example.com"  # same email key as REF_EMAIL
FRIENDS = [f"testfriend{i}{UID}@example.com" for i in range(3)]
STATE = {}


def cust(email):
    return {"full_name": "TEST_User", "email": email, "phone": "+6591234567",
            "address": "1 Orchard Road #01-01", "postal_code": "238823"}


def order(email, code=None, qty=1, plan="one_time"):
    body = {"plan": plan, "quantity": qty, "payment_method": "card", "customer": cust(email)}
    if code is not None:
        body["code"] = code
    return requests.post(f"{BASE_URL}/api/orders", json=body, timeout=30)


@pytest.fixture(scope="module", autouse=True)
def mongo_cleanup():
    db = MongoClient(ENV["MONGO_URL"])[ENV["DB_NAME"]]
    STATE["db"] = db
    yield
    keys = [REF_EMAIL] + FRIENDS
    db.orders.delete_many({"email_key": {"$in": keys}})
    if STATE.get("code"):
        db.reward_codes.delete_many({"referral_code": STATE["code"]})
    db.referrals.delete_many({"owner_key": {"$in": keys}})


# --- referral code issuance
def test_order_returns_referral_code():
    r = order(REF_EMAIL)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["referral_code"].startswith("BIO") and len(d["referral_code"]) == 9
    assert d["discount"] == 0 and d["total"] == 300
    STATE["code"] = d["referral_code"]
    g = requests.get(f"{BASE_URL}/api/orders/{d['id']}").json()
    assert g["referral_code"] == STATE["code"]


def test_same_email_key_reuses_code_and_own_code_rejected():
    r = order(REF_VARIANT)
    assert r.status_code == 200, r.text
    assert r.json()["referral_code"] == STATE["code"]
    r2 = order(REF_VARIANT, code=STATE["code"])
    assert r2.status_code == 400
    assert "own" in r2.json()["detail"].lower()


# --- code preview
def test_preview_referral_and_unknown():
    r = requests.get(f"{BASE_URL}/api/codes/{STATE['code'].lower()}")
    assert r.status_code == 200
    assert r.json()["kind"] == "referral" and r.json()["code"] == STATE["code"]
    assert requests.get(f"{BASE_URL}/api/codes/BIOZZZZZZ").status_code == 404
    assert requests.get(f"{BASE_URL}/api/codes/FREEZZZZZZ").status_code == 404
    assert requests.get(f"{BASE_URL}/api/codes/HELLO").status_code == 404


# --- friend discount
def test_friend_first_order_discount():
    r = order(FRIENDS[0], code=STATE["code"])
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["discount"] == 25 and d["total"] == d["subtotal"] - 25 == 275
    assert d["applied_code"] == STATE["code"]
    assert d["referral_code"].startswith("BIO") and d["referral_code"] != STATE["code"]
    s = requests.get(f"{BASE_URL}/api/referrals/{STATE['code']}").json()
    assert s["successful_count"] == 1 and s["friends_to_next_reward"] == 2


def test_repeat_customer_and_unknown_code_rejected():
    r = order(FRIENDS[0], code=STATE["code"])
    assert r.status_code == 400 and "first order" in r.json()["detail"]
    r2 = order(FRIENDS[1], code="BIONOPE99")
    assert r2.status_code == 400


# --- reward after 3 friends
def test_three_friends_issue_reward():
    for f in FRIENDS[1:]:
        r = order(f, code=STATE["code"])
        assert r.status_code == 200, r.text
        assert r.json()["discount"] == 25
    s = requests.get(f"{BASE_URL}/api/referrals/{STATE['code']}").json()
    assert s["successful_count"] == 3 and s["rewards_earned"] == 1 and s["friends_to_next_reward"] == 3
    rewards = list(STATE["db"].reward_codes.find({"referral_code": STATE["code"]}))
    assert len(rewards) == 1 and rewards[0]["code"].startswith("FREE") and rewards[0]["used"] is False
    STATE["reward"] = rewards[0]["code"]


def test_reward_preview_use_and_reuse():
    rc = STATE["reward"]
    p = requests.get(f"{BASE_URL}/api/codes/{rc}")
    assert p.status_code == 200 and p.json()["kind"] == "reward"
    r = order(REF_EMAIL, code=rc, qty=2)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["discount"] == d["unit_price"] == 275 and d["total"] == 275
    assert d["discount_label"] == "Reward: 1 free box"
    again = order(REF_EMAIL, code=rc)
    assert again.status_code == 400
    assert requests.get(f"{BASE_URL}/api/codes/{rc}").status_code == 404


# --- admin applications
def test_admin_applications_auth():
    assert requests.get(f"{BASE_URL}/api/admin/clinic-applications").status_code == 401
    assert requests.get(f"{BASE_URL}/api/admin/clinic-applications", headers={"X-Admin-Passcode": "WRONG"}).status_code == 401
    r = requests.get(f"{BASE_URL}/api/admin/clinic-applications", headers={"X-Admin-Passcode": ADMIN_PASSCODE})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        assert {"id", "clinic_name", "credentials", "email", "created_at"} <= set(data[0])
        assert "_id" not in data[0]


# --- rate limit (run last; restart backend afterwards to clear in-memory limits)
def test_code_preview_rate_limit():
    statuses = [requests.get(f"{BASE_URL}/api/codes/BIOAAAAAA").status_code for _ in range(32)]
    assert 429 in statuses
    assert statuses.index(429) <= 30
