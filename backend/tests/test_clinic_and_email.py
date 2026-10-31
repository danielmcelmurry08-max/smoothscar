# Clinic partner applications + order confirmation email (Resend) tests
import os
import random
import subprocess
import time
import uuid

import pytest
import requests
from pymongo import MongoClient
from bson import ObjectId

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")


def _read_env(path):
    out = {}
    for line in open(path):
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.strip().split("=", 1)
            out[k] = v.strip().strip('"')
    return out


BENV = _read_env("/app/backend/.env")


def _ip():
    return f"172.{random.randint(16, 31)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


def _payload(**kw):
    p = {"clinic_name": "TEST_Orchard Aesthetics", "contact_name": "TEST Dr Tan", "role": "Director",
         "email": "delivered@resend.dev", "phone": "+6561234567", "location": "Singapore",
         "practice_type": "Dermatology", "monthly_volume": "6–20 boxes", "message": "TEST message"}
    p.update(kw)
    return p


@pytest.fixture(scope="module")
def db():
    c = MongoClient(BENV["MONGO_URL"])
    d = c[BENV["DB_NAME"]]
    yield d
    d.clinic_applications.delete_many({"clinic_name": {"$regex": "^TEST_"}})
    c.close()


def _post(payload, ip=None):
    return requests.post(f"{BASE_URL}/api/clinic-applications", json=payload,
                         headers={"X-Forwarded-For": ip or _ip()}, timeout=30)


def _log_tail(n=400):
    return subprocess.run(f"tail -n {n} /var/log/supervisor/backend.*.log", shell=True,
                          capture_output=True, text=True).stdout


# Clinic application: create + persistence
def test_clinic_create_persists(db):
    r = _post(_payload())
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["id"] and "_id" not in d and d["status"] == "new"
    assert d["practice_type"] == "Dermatology" and d["monthly_volume"] == "6–20 boxes"
    doc = db.clinic_applications.find_one({"_id": ObjectId(d["id"])})
    assert doc and doc["clinic_name"] == "TEST_Orchard Aesthetics" and doc["email"] == "delivered@resend.dev"


@pytest.mark.parametrize("pt,vol", [("O&G / Maternity", "2–5 boxes"), ("Pharmacy / Retail", "50+ boxes")])
def test_clinic_all_enums_valid(pt, vol):
    r = _post(_payload(practice_type=pt, monthly_volume=vol, role=None, message=None))
    assert r.status_code == 200, r.text
    assert r.json()["role"] is None


# Clinic application: validation
@pytest.mark.parametrize("override", [
    {"practice_type": "Dentist"}, {"monthly_volume": "100 boxes"}, {"monthly_volume": "2-5 boxes"},
    {"email": "not-an-email"}, {"clinic_name": "A"}, {"contact_name": ""}, {"phone": "123"},
    {"location": "S"}, {"message": "x" * 1501},
])
def test_clinic_validation(override):
    assert _post(_payload(**override)).status_code == 422


@pytest.mark.parametrize("missing", ["clinic_name", "contact_name", "email", "phone", "location", "practice_type", "monthly_volume"])
def test_clinic_required_fields(missing):
    p = _payload()
    p.pop(missing)
    assert _post(p).status_code == 422


# Clinic application: rate limit 5 / IP / hour
def test_clinic_rate_limit():
    ip = _ip()
    codes = [_post(_payload(), ip=ip).status_code for _ in range(6)]
    assert codes[:5] == [200] * 5, codes
    assert codes[5] == 429
    # other IP still allowed
    assert _post(_payload()).status_code == 200


# Clinic application triggers admin email attempt (known undeliverable for info@smoothscar.com)
def test_clinic_email_attempted():
    _post(_payload(clinic_name="TEST_EmailCheck"))
    time.sleep(6)
    log = _log_tail()
    assert "New clinic partner application: TEST_EmailCheck" in log or "Email send failed" in log


# Orders: background confirmation email to resend test inbox
def test_order_triggers_email():
    email = f"delivered+emailchk{uuid.uuid4().hex[:6]}@resend.dev"
    r = requests.post(f"{BASE_URL}/api/orders", headers={"X-Forwarded-For": _ip()}, timeout=30, json={
        "plan": "one_time", "quantity": 1, "payment_method": "card",
        "customer": {"full_name": "TEST Emailer", "email": email, "phone": "+6591234567",
                     "address": "1 Orchard Road", "postal_code": "238823"}})
    assert r.status_code == 200, r.text
    num = r.json()["order_number"]
    time.sleep(8)
    log = _log_tail()
    assert f"Email sent (Your BioRNA Antiscar order {num} is confirmed)" in log, log[-1500:]


# Orders: rate limit 5 / customer email / hour
def test_order_email_rate_limit():
    email = f"delivered+rl{uuid.uuid4().hex[:6]}@resend.dev"
    body = {"plan": "one_time", "quantity": 1, "payment_method": "card",
            "customer": {"full_name": "TEST RL", "email": email, "phone": "+6591234567",
                         "address": "1 Orchard Road", "postal_code": "238823"}}
    codes = [requests.post(f"{BASE_URL}/api/orders", json=body, headers={"X-Forwarded-For": _ip()}, timeout=30).status_code
             for _ in range(6)]
    assert codes[:5] == [200] * 5 and codes[5] == 429, codes
