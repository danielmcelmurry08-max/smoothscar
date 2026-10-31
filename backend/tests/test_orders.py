# BioRNA Antiscar orders API regression tests
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
CUST = {"full_name": "TEST_User", "email": "test@example.com", "phone": "+6591234567",
        "address": "1 Orchard Road #01-01", "postal_code": "238823"}


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _order(api, plan, qty, pay="apple_pay", **extra):
    c = dict(CUST, **extra)
    return api.post(f"{BASE_URL}/api/orders", json={"plan": plan, "quantity": qty, "payment_method": pay, "customer": c})


# Health / pricing
def test_root(api):
    r = api.get(f"{BASE_URL}/api/")
    assert r.status_code == 200 and "BioRNA" in r.json()["message"]


def test_pricing(api):
    p = api.get(f"{BASE_URL}/api/pricing").json()["plans"]
    assert p["one_time"]["unit_price"] == 300 and p["subscribe"]["unit_price"] == 270 and p["clinic"]["unit_price"] == 185


# Create + GET persistence
@pytest.mark.parametrize("plan,qty,total,extra", [
    ("one_time", 1, 300, {}), ("one_time", 10, 3000, {}), ("subscribe", 1, 270, {}), ("subscribe", 4, 1080, {}),
    ("clinic", 2, 370, {"clinic_name": "TEST Clinic"}), ("clinic", 5, 925, {"clinic_name": "TEST Clinic"}),
    ("clinic", 10, 1850, {"clinic_name": "TEST Clinic"}),
])
def test_create_and_get(api, plan, qty, total, extra):
    r = _order(api, plan, qty, **extra)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "id" in d and "_id" not in d
    assert d["total"] == total and d["payment_status"] == "mock_paid" and d["order_number"].startswith("BRNA-")
    g = api.get(f"{BASE_URL}/api/orders/{d['id']}")
    assert g.status_code == 200 and g.json()["total"] == total and g.json()["id"] == d["id"]


# Validation
@pytest.mark.parametrize("plan,qty,extra", [
    ("one_time", 0, {}), ("one_time", 11, {}), ("subscribe", 5, {}),
    ("clinic", 1, {"clinic_name": "X Clinic"}), ("clinic", 3, {"clinic_name": "X Clinic"}),
    ("clinic", 2, {}), ("clinic", 2, {"clinic_name": "   "}),
])
def test_invalid_orders(api, plan, qty, extra):
    r = _order(api, plan, qty, **extra)
    assert r.status_code in (400, 422), r.text


def test_invalid_email_and_plan(api):
    assert _order(api, "one_time", 1, email="bad").status_code == 422
    assert _order(api, "bogus", 1).status_code == 422
    assert _order(api, "one_time", 1, pay="paypal").status_code == 422


def test_client_price_ignored(api):
    r = api.post(f"{BASE_URL}/api/orders", json={"plan": "one_time", "quantity": 1, "payment_method": "card",
                                                  "customer": CUST, "total": 1, "unit_price": 1})
    assert r.status_code == 200 and r.json()["total"] == 300


def test_get_404(api):
    assert api.get(f"{BASE_URL}/api/orders/notanid").status_code == 404
    assert api.get(f"{BASE_URL}/api/orders/000000000000000000000000").status_code == 404
