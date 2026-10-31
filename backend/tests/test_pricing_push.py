# Iteration 3: new pricing, clinic-application required fields, push registration, reminders API
import os
import random
import uuid

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
CUST = {"full_name": "TEST_User", "phone": "+6591234567",
        "address": "1 Orchard Road #01-01", "postal_code": "238823"}
CREATED = {}


def _ip():
    return f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


def _h():
    return {"X-Forwarded-For": _ip()}


def _email(label):
    return f"delivered+{label}{uuid.uuid4().hex[:4]}@resend.dev"


def _order(plan, qty, label):
    return requests.post(f"{BASE_URL}/api/orders", headers=_h(), json={
        "plan": plan, "quantity": qty, "payment_method": "card",
        "customer": dict(CUST, email=_email(label))})


# Pricing endpoint
def test_pricing_endpoint():
    p = requests.get(f"{BASE_URL}/api/pricing").json()["plans"]
    assert p["one_time"]["unit_price"] == 300 and p["one_time"]["bundle_price"] == 275
    assert p["subscribe"]["unit_price"] == 275
    assert p["subscribe"]["allowed_qty"] == [2, 4]
    assert p["subscribe"]["interval"] == "Every 2 weeks"


# Pricing via orders (order-email limiter is 5/h collapsed; we create exactly 4)
@pytest.mark.parametrize("plan,qty,unit,total,interval", [
    ("one_time", 1, 300, 300, None),
    ("one_time", 2, 275, 550, None),
    ("subscribe", 2, 275, 550, "Every 2 weeks"),
    ("subscribe", 4, 275, 1100, "Every 2 weeks"),
])
def test_order_pricing(plan, qty, unit, total, interval):
    r = _order(plan, qty, f"p{qty}{plan[:2]}")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["unit_price"] == unit and d["total"] == total and d["interval"] == interval
    assert d["reminders_enabled"] is False
    CREATED[f"{plan}{qty}"] = d["id"]
    g = requests.get(f"{BASE_URL}/api/orders/{d['id']}").json()
    assert g["total"] == total


@pytest.mark.parametrize("qty", [1, 3, 5])
def test_subscribe_disallowed_qty(qty):
    r = _order("subscribe", qty, "bad")
    assert r.status_code == 400, r.text


# Clinic application fields
def _clinic(**over):
    body = {"clinic_name": "TEST_Clinic", "email": _email("cl"), "phone": "+6598765432",
            "credentials": "MOH licence 12345"}
    body.update(over)
    return requests.post(f"{BASE_URL}/api/clinic-applications", headers=_h(), json=body)


def test_clinic_minimal_required_only():
    r = _clinic()
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["credentials"] == "MOH licence 12345" and d["contact_name"] is None and d["location"] is None
    assert d["practice_type"] is None and d["monthly_volume"] is None and "_id" not in d


@pytest.mark.parametrize("missing", ["clinic_name", "email", "phone", "credentials"])
def test_clinic_missing_required(missing):
    body = {"clinic_name": "TEST_Clinic", "email": _email("cl"), "phone": "+6598765432", "credentials": "MOH 123"}
    body.pop(missing)
    r = requests.post(f"{BASE_URL}/api/clinic-applications", headers=_h(), json=body)
    assert r.status_code == 422


def test_clinic_credentials_too_short():
    assert _clinic(credentials="ab").status_code == 422


# Push registration
def test_register_push_validation():
    bad = [{"user_id": "short", "platform": "ios", "device_token": "x" * 20},
           {"user_id": "bad id with spaces", "platform": "ios", "device_token": "x" * 20},
           {"user_id": "dev_abcdefgh12", "platform": "web", "device_token": "x" * 20},
           {"user_id": "dev_abcdefgh12", "platform": "ios", "device_token": "short"}]
    for b in bad:
        assert requests.post(f"{BASE_URL}/api/register-push", headers=_h(), json=b).status_code == 422, b


def test_register_push_placeholder_key_expected_500():
    r = requests.post(f"{BASE_URL}/api/register-push", headers=_h(),
                      json={"user_id": "dev_testabc123", "platform": "android", "device_token": "tok_" + "a" * 20})
    assert r.status_code in (201, 500)
    if r.status_code == 500:
        assert "EMERGENT_PUSH_KEY" in r.json()["detail"]


# Reminders opt-in / opt-out
def test_reminders_enable_disable():
    oid = CREATED.get("one_time1")
    if not oid:
        pytest.skip("no order created")
    r = requests.post(f"{BASE_URL}/api/orders/{oid}/reminders", json={"push_user_id": "dev_testabc123"})
    assert r.status_code == 200, r.text
    assert r.json()["reminders_enabled"] is True
    assert requests.get(f"{BASE_URL}/api/orders/{oid}").json()["reminders_enabled"] is True
    # idempotent second enable
    assert requests.post(f"{BASE_URL}/api/orders/{oid}/reminders", json={"push_user_id": "dev_testabc123"}).status_code == 200
    d = requests.delete(f"{BASE_URL}/api/orders/{oid}/reminders")
    assert d.status_code == 200 and d.json()["reminders_enabled"] is False
    assert requests.get(f"{BASE_URL}/api/orders/{oid}").json()["reminders_enabled"] is False


def test_reminders_bad_push_user_id():
    oid = CREATED.get("one_time1")
    if not oid:
        pytest.skip("no order created")
    r = requests.post(f"{BASE_URL}/api/orders/{oid}/reminders", json={"push_user_id": "bad id!"})
    assert r.status_code == 422


@pytest.mark.parametrize("oid", ["notanid", "000000000000000000000000"])
def test_reminders_404(oid):
    assert requests.post(f"{BASE_URL}/api/orders/{oid}/reminders", json={"push_user_id": "dev_testabc123"}).status_code == 404
    assert requests.delete(f"{BASE_URL}/api/orders/{oid}/reminders").status_code == 404
