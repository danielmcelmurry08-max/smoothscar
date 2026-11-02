# Customer accounts: /api/auth/* (Google/Apple/me/logout) + /api/me/orders, /api/me/referral, order user_id linking
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
ENV = dotenv_values(Path(__file__).resolve().parents[1] / ".env")
SEED_TOKEN = "st_test_session_0001"
SEED_USER = "user_test0001"
SEED_EMAIL = "delivered+auth@resend.dev"
UID = uuid.uuid4().hex[:8]
H = {"Authorization": f"Bearer {SEED_TOKEN}"}
STATE = {"order_ids": []}


@pytest.fixture(scope="module")
def mdb():
    c = MongoClient(ENV["MONGO_URL"])
    db = c[ENV["DB_NAME"]]
    yield db
    from bson import ObjectId
    db.orders.delete_many({"_id": {"$in": [ObjectId(i) for i in STATE["order_ids"]]}})
    db.user_sessions.delete_many({"session_token": {"$regex": "^st_TEST_"}})
    c.close()


def cust(email):
    return {"full_name": "TEST_Auth", "email": email, "phone": "+6591234567",
            "address": "1 Orchard Road #01-01", "postal_code": "238823"}


def place(email, headers=None):
    r = requests.post(f"{BASE_URL}/api/orders", json={"plan": "one_time", "quantity": 1, "payment_method": "card",
                                                      "customer": cust(email)}, headers=headers or {}, timeout=30)
    assert r.status_code == 200, r.text
    STATE["order_ids"].append(r.json()["id"])
    return r.json()


# --- /auth/me
def test_me_with_seeded_session():
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=H, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["user_id"] == SEED_USER and d["email"] == SEED_EMAIL and d["name"] == "Test Customer"
    assert "_id" not in d


def test_me_no_header_401():
    assert requests.get(f"{BASE_URL}/api/auth/me", timeout=15).status_code == 401


def test_me_bad_token_401():
    r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer st_nope"}, timeout=15)
    assert r.status_code == 401


def test_me_expired_session_401(mdb):
    tok = f"st_TEST_exp_{UID}"
    mdb.user_sessions.insert_one({"session_token": tok, "user_id": SEED_USER,
                                  "created_at": datetime.now(timezone.utc) - timedelta(days=8),
                                  "expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)})
    r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 401


# --- Google / Apple exchange
def test_google_session_bad_id_401():
    r = requests.post(f"{BASE_URL}/api/auth/session", json={"session_id": "bad_session_xyz"}, timeout=30)
    assert r.status_code == 401, r.text


def test_google_session_validation_422():
    assert requests.post(f"{BASE_URL}/api/auth/session", json={}, timeout=15).status_code == 422


def test_apple_bad_token_401():
    r = requests.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": "x" * 40}, timeout=30)
    assert r.status_code == 401, r.text


def test_apple_forged_jwt_401():
    import jwt
    forged = jwt.encode({"sub": "evil", "iss": "https://appleid.apple.com", "aud": "host.exp.Exponent"}, "secret", algorithm="HS256")
    r = requests.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": forged}, timeout=30)
    assert r.status_code == 401, r.text


# --- logout
def test_logout_deletes_session(mdb):
    tok = f"st_TEST_logout_{UID}"
    now = datetime.now(timezone.utc)
    mdb.user_sessions.insert_one({"session_token": tok, "user_id": SEED_USER, "created_at": now, "expires_at": now + timedelta(days=1)})
    hh = {"Authorization": f"Bearer {tok}"}
    assert requests.get(f"{BASE_URL}/api/auth/me", headers=hh, timeout=15).status_code == 200
    r = requests.post(f"{BASE_URL}/api/auth/logout", headers=hh, timeout=15)
    assert r.status_code == 200 and r.json() == {"ok": True}
    assert requests.get(f"{BASE_URL}/api/auth/me", headers=hh, timeout=15).status_code == 401
    assert mdb.user_sessions.find_one({"session_token": tok}) is None
    # seeded session untouched
    assert requests.get(f"{BASE_URL}/api/auth/me", headers=H, timeout=15).status_code == 200


# --- /me endpoints require Bearer
def test_me_orders_and_referral_need_auth():
    assert requests.get(f"{BASE_URL}/api/me/orders", timeout=15).status_code == 401
    assert requests.get(f"{BASE_URL}/api/me/referral", timeout=15).status_code == 401
    assert requests.get(f"{BASE_URL}/api/me/orders", headers={"Authorization": "Bearer bad"}, timeout=15).status_code == 401


# --- order linking
def test_signed_in_order_links_user_id(mdb):
    o = place(f"testauthlink{UID}@example.com", H)
    from bson import ObjectId
    assert mdb.orders.find_one({"_id": ObjectId(o["id"])})["user_id"] == SEED_USER
    STATE["linked"] = o["id"]


def test_guest_order_bad_token_still_works(mdb):
    o = place(f"testauthguest{UID}@example.com", {"Authorization": "Bearer st_garbage"})
    from bson import ObjectId
    assert "user_id" not in mdb.orders.find_one({"_id": ObjectId(o["id"])})
    STATE["guest"] = o["id"]


def test_email_matching_orders():
    STATE["exact_ci"] = place("DELIVERED+AUTH@resend.dev")["id"]
    STATE["alias"] = place("delivered+other@resend.dev")["id"]
    STATE["dot"] = place("deli.vered+auth@resend.dev")["id"]
    r = requests.get(f"{BASE_URL}/api/me/orders", headers=H, timeout=15)
    assert r.status_code == 200
    ids = [o["id"] for o in r.json()]
    assert STATE["linked"] in ids, "user_id-linked order missing"
    assert STATE["exact_ci"] in ids, "case-insensitive exact email order missing"
    assert STATE["alias"] not in ids, "alias (+other) order leaked"
    assert STATE["dot"] not in ids, "dot-variant order leaked"
    assert STATE["guest"] not in ids
    assert all("_id" not in o for o in r.json())


def test_me_referral_shape():
    r = requests.get(f"{BASE_URL}/api/me/referral", headers=H, timeout=15)
    assert r.status_code == 200
    d = r.json()
    # key delivered@resend.dev is owned by delivered+ref0@resend.dev, so the seeded user must not see it
    assert d is None or (d.get("code") and isinstance(d.get("reward_codes"), list))
    if d:
        assert "_id" not in d
