# Iteration 7: live pricing (admin), admin orders dashboard, verified-buyer reviews, partner applications
import os
import random
import uuid

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
PASS = "10F40F7B"
ADM = {"X-Admin-Passcode": PASS}
CUST = {"full_name": "TEST_Reviewer", "phone": "+6591234567",
        "address": "1 Orchard Road #01-01", "postal_code": "238823"}
DEFAULT = {"single": 300, "bundle": 275, "autoship": 275}


def _h(extra=None):
    h = {"X-Forwarded-For": f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"}
    h.update(extra or {})
    return h


def _email(label):
    return f"test_{label}{uuid.uuid4().hex[:6]}@example.com"


def _order(plan, qty, email=None, postal="238823"):
    email = email or _email("o")
    r = requests.post(f"{BASE_URL}/api/orders", headers=_h(), json={
        "plan": plan, "quantity": qty, "payment_method": "card",
        "customer": dict(CUST, email=email, postal_code=postal)})
    assert r.status_code == 200, r.text
    return r.json(), email


def _set_prices(p):
    return requests.put(f"{BASE_URL}/api/admin/pricing", headers=_h(ADM), json=p)


@pytest.fixture(scope="module", autouse=True)
def reset_prices():
    yield
    r = _set_prices(DEFAULT)
    assert r.status_code == 200 and r.json() == DEFAULT


# ---- Pricing ----
class TestPricing:
    def test_public_pricing_defaults(self):
        _set_prices(DEFAULT)
        d = requests.get(f"{BASE_URL}/api/pricing").json()
        assert d["prices"] == DEFAULT
        assert d["plans"]["one_time"]["unit_price"] == 300 and d["plans"]["one_time"]["bundle_price"] == 275
        assert d["plans"]["subscribe"]["unit_price"] == 275

    def test_put_requires_passcode(self):
        r = requests.put(f"{BASE_URL}/api/admin/pricing", headers=_h(), json=DEFAULT)
        assert r.status_code == 401
        r = requests.get(f"{BASE_URL}/api/admin/pricing", headers=_h({"X-Admin-Passcode": "WRONG"}))
        assert r.status_code == 401

    @pytest.mark.parametrize("body", [
        {"single": 0, "bundle": 1, "autoship": 1},
        {"single": 5001, "bundle": 275, "autoship": 275},
        {"single": 300, "bundle": 301, "autoship": 275},
        {"single": 300, "bundle": 275},
    ])
    def test_put_validation(self, body):
        assert _set_prices(body).status_code == 422

    def test_put_updates_and_orders_use_new_prices(self):
        r = _set_prices({"single": 320, "bundle": 290, "autoship": 260})
        assert r.status_code == 200 and r.json() == {"single": 320, "bundle": 290, "autoship": 260}
        assert requests.get(f"{BASE_URL}/api/pricing").json()["prices"]["single"] == 320
        assert requests.get(f"{BASE_URL}/api/admin/pricing", headers=_h(ADM)).json()["bundle"] == 290
        o1, _ = _order("one_time", 1)
        assert o1["unit_price"] == 320 and o1["total"] == 320
        o2, _ = _order("one_time", 3)
        assert o2["unit_price"] == 290 and o2["total"] == 870
        o3, _ = _order("subscribe", 2)
        assert o3["unit_price"] == 260 and o3["total"] == 520
        assert _set_prices(DEFAULT).json() == DEFAULT
        o4, _ = _order("subscribe", 4)
        assert o4["unit_price"] == 275 and o4["total"] == 1100


# ---- Admin orders dashboard ----
class TestAdminOrders:
    def test_requires_passcode(self):
        assert requests.get(f"{BASE_URL}/api/admin/orders", headers=_h()).status_code == 401

    def test_orders_shape_and_region(self):
        o, email = _order("one_time", 1, postal="520123")  # sector 52 -> East
        d = requests.get(f"{BASE_URL}/api/admin/orders?days=7", headers=_h(ADM)).json()
        assert set(d) == {"orders", "stats"}
        row = next(x for x in d["orders"] if x["order_number"] == o["order_number"])
        assert row["region"] == "East"
        assert row["time_slot"] in ("Morning", "Afternoon", "Evening", "Overnight")
        assert row["sgt_time"] and "account" in row
        assert row["customer"]["email"] == email and row["customer"]["address"]
        s = d["stats"]
        for k in ("orders", "revenue", "boxes", "average_order", "unique_customers", "by_region",
                  "by_time_slot", "by_hour", "peak_hour", "by_plan", "active_autoships"):
            assert k in s, k
        assert len(s["by_hour"]) == 24 and sum(s["by_hour"]) == s["orders"] == len(d["orders"])
        assert s["revenue"] == sum(x["total"] for x in d["orders"])
        assert sum(x["orders"] for x in s["by_region"]) == s["orders"]

    def test_days_filter(self):
        all_n = requests.get(f"{BASE_URL}/api/admin/orders?days=0", headers=_h(ADM)).json()["stats"]["orders"]
        n7 = requests.get(f"{BASE_URL}/api/admin/orders?days=7", headers=_h(ADM)).json()["stats"]["orders"]
        assert all_n >= n7 > 0

    @pytest.mark.parametrize("postal,region", [("238823", "Central"), ("560123", "North-East"),
                                               ("640123", "West"), ("730123", "North"), ("12345", "Unknown")])
    def test_sg_region_unit(self, postal, region):
        import sys
        sys.path.insert(0, "/app/backend")
        from admin import sg_region
        assert sg_region(postal) == region


# ---- Reviews ----
class TestReviews:
    @pytest.fixture(scope="class")
    def order(self):
        o, email = _order("one_time", 1)
        return o, email

    def _review(self, **over):
        body = {"order_number": "X", "email": "x@example.com", "rating": 5, "display_name": "TEST_Rev",
                "title": "Great", "body": "This cream really helped my scar.", "scar_type": "C-section"}
        body.update(over)
        return requests.post(f"{BASE_URL}/api/reviews", headers=_h(), json=body)

    def test_mismatch_email_400(self, order):
        o, _ = order
        r = self._review(order_number=o["order_number"], email="wrong@example.com")
        assert r.status_code == 400

    def test_unknown_order_400(self):
        assert self._review(order_number="BRNA-000000-9999").status_code == 400

    @pytest.mark.parametrize("over", [{"rating": 0}, {"rating": 6}, {"body": "short"}, {"display_name": "A"}])
    def test_validation_422(self, order, over):
        o, email = order
        assert self._review(order_number=o["order_number"], email=email, **over).status_code == 422

    def test_create_moderate_flow(self, order):
        o, email = order
        # lowercase order number + upper email still match
        r = self._review(order_number=o["order_number"].lower(), email=email.upper(), rating=4,
                         display_name="TEST_Flow")
        assert r.status_code == 201 and r.json()["status"] == "pending"
        assert self._review(order_number=o["order_number"], email=email).status_code == 409
        pub = requests.get(f"{BASE_URL}/api/reviews").json()
        assert all(x["display_name"] != "TEST_Flow" for x in pub["reviews"])
        assert "customer_email" not in (pub["reviews"][0] if pub["reviews"] else {})
        pend = requests.get(f"{BASE_URL}/api/admin/reviews?status=pending", headers=_h(ADM)).json()
        rev = next(x for x in pend if x["order_number"] == o["order_number"])
        assert rev["rating"] == 4 and rev["status"] == "pending"
        before = pub["count"]
        r = requests.post(f"{BASE_URL}/api/admin/reviews/{rev['id']}", headers=_h(ADM), json={"status": "approved"})
        assert r.status_code == 200
        pub2 = requests.get(f"{BASE_URL}/api/reviews").json()
        assert pub2["count"] == before + 1 and pub2["reviews"][0]["display_name"] == "TEST_Flow"
        assert sum(pub2["distribution"].values()) == pub2["count"]
        appr = requests.get(f"{BASE_URL}/api/admin/reviews?status=approved", headers=_h(ADM)).json()
        assert any(x["id"] == rev["id"] for x in appr)
        r = requests.post(f"{BASE_URL}/api/admin/reviews/{rev['id']}", headers=_h(ADM), json={"status": "rejected"})
        assert r.status_code == 200
        pub3 = requests.get(f"{BASE_URL}/api/reviews").json()
        assert pub3["count"] == before
        rej = requests.get(f"{BASE_URL}/api/admin/reviews?status=rejected", headers=_h(ADM)).json()
        assert any(x["id"] == rev["id"] for x in rej)
        allr = requests.get(f"{BASE_URL}/api/admin/reviews?status=all", headers=_h(ADM)).json()
        assert any(x["id"] == rev["id"] for x in allr)

    def test_admin_review_errors(self):
        assert requests.get(f"{BASE_URL}/api/admin/reviews", headers=_h()).status_code == 401
        assert requests.post(f"{BASE_URL}/api/admin/reviews/bad", headers=_h(ADM), json={"status": "approved"}).status_code == 404
        assert requests.post(f"{BASE_URL}/api/admin/reviews/{'0'*24}", headers=_h(ADM), json={"status": "approved"}).status_code == 404
        assert requests.post(f"{BASE_URL}/api/admin/reviews/{'0'*24}", headers=_h(ADM), json={"status": "bogus"}).status_code == 422


# ---- Partner applications ----
class TestPartners:
    def test_application_saved_and_listed(self):
        import time
        body = {"clinic_name": "TEST_PartnerClinic", "email": _email("cl"), "phone": "+6598765432", "credentials": "MOH 12345"}
        r = requests.post(f"{BASE_URL}/api/clinic-applications", headers=_h(), json=body)
        assert r.status_code == 200, r.text
        app_id = r.json()["id"]
        time.sleep(4)
        lst = requests.get(f"{BASE_URL}/api/admin/clinic-applications", headers=_h(ADM)).json()
        row = next(x for x in lst if x["id"] == app_id)
        print("email_status:", row.get("email_status"))
        assert row["clinic_name"] == "TEST_PartnerClinic"
