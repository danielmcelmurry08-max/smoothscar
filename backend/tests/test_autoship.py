# Manage Auto-Ship: GET /api/me/autoships + POST /api/me/autoships/{id} actions
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
TOKEN = "st_test_session_0001"
H = {"Authorization": f"Bearer {TOKEN}"}
_CREATED: list = []  # order numbers made by this worker, deleted at teardown


def _parse(s):
    d = datetime.fromisoformat(s.replace("Z", "+00:00"))
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _create_order(headers=None, email=None, plan="subscribe", qty=2):
    payload = {
        "plan": plan,
        "quantity": qty,
        "payment_method": "apple_pay",
        "customer": {
            "full_name": "TEST_Autoship",
            "email": email or f"test_as_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "+6591234567",
            "address": "1 Orchard Road #01-01",
            "postal_code": "238823",
        },
    }
    r = requests.post(f"{BASE_URL}/api/orders", json=payload,
                      headers={**(headers or {}), "X-Forwarded-For": f"10.9.{uuid.uuid4().int % 250}.{uuid.uuid4().int % 250}"})
    assert r.status_code in (200, 201), r.text
    _CREATED.append(r.json()["order_number"])
    return r.json()


def _list():
    r = requests.get(f"{BASE_URL}/api/me/autoships", headers=H)
    assert r.status_code == 200, r.text
    return r.json()


def _act(oid, action, qty=None, headers=H):
    body = {"action": action}
    if qty is not None:
        body["quantity"] = qty
    return requests.post(f"{BASE_URL}/api/me/autoships/{oid}", json=body, headers=headers)


@pytest.fixture(scope="module", autouse=True)
def _cleanup():
    yield
    from pymongo import MongoClient
    MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]].orders.delete_many({"order_number": {"$in": _CREATED}})


@pytest.fixture(scope="module")
def plan_id():
    o = _create_order(headers=H)
    num = o.get("order_number") or o.get("order", {}).get("order_number")
    plans = _list()
    match = [p for p in plans if p["order_number"] == num]
    assert match, f"new order {num} not listed in autoships: {[p['order_number'] for p in plans]}"
    return match[0]["id"]


class TestList:
    def test_401_without_bearer(self):
        assert requests.get(f"{BASE_URL}/api/me/autoships").status_code == 401

    def test_list_shape_and_default_date(self, plan_id):
        p = [x for x in _list() if x["id"] == plan_id][0]
        assert p["status"] == "active"
        assert p["quantity"] == 2
        assert p["per_shipment"] == 550
        assert "_id" not in p
        diff = _parse(p["next_ship_date"]) - _parse(p["created_at"])
        assert abs(diff - timedelta(days=14)) < timedelta(minutes=1)

    def test_email_match_case_insensitive(self):
        o = _create_order(email="DELIVERED+AUTH@resend.dev")  # no bearer -> linked by email only
        num = o.get("order_number") or o.get("order", {}).get("order_number")
        assert num in [p["order_number"] for p in _list()]

    def test_email_partial_not_matched(self):
        o = _create_order(email="xdelivered+auth@resend.dev")
        num = o.get("order_number") or o.get("order", {}).get("order_number")
        assert num not in [p["order_number"] for p in _list()]

    def test_one_time_orders_not_listed(self):
        o = _create_order(headers=H, plan="one_time")
        num = o.get("order_number") or o.get("order", {}).get("order_number")
        assert num not in [p["order_number"] for p in _list()]


class TestActions:
    def test_skip(self, plan_id):
        before = [x for x in _list() if x["id"] == plan_id][0]
        r = _act(plan_id, "skip")
        assert r.status_code == 200, r.text
        d = r.json()
        assert _parse(d["next_ship_date"]) - _parse(before["next_ship_date"]) == timedelta(days=14)
        assert d["skips_used"] == before["skips_used"] + 1
        assert [x for x in _list() if x["id"] == plan_id][0]["next_ship_date"] == d["next_ship_date"]

    def test_change_qty_4(self, plan_id):
        r = _act(plan_id, "change_qty", 4)
        assert r.status_code == 200 and r.json()["quantity"] == 4 and r.json()["per_shipment"] == 1100
        assert [x for x in _list() if x["id"] == plan_id][0]["quantity"] == 4

    def test_change_qty_invalid(self, plan_id):
        assert _act(plan_id, "change_qty", 3).status_code == 400
        assert _act(plan_id, "change_qty").status_code == 400

    def test_invalid_action_422(self, plan_id):
        assert _act(plan_id, "explode").status_code == 422

    def test_pause_then_skip_400(self, plan_id):
        r = _act(plan_id, "pause")
        assert r.status_code == 200 and r.json()["status"] == "paused" and r.json()["next_ship_date"] is None
        assert _act(plan_id, "skip").status_code == 400
        assert _act(plan_id, "pause").status_code == 400

    def test_resume(self, plan_id):
        r = _act(plan_id, "resume")
        assert r.status_code == 200 and r.json()["status"] == "active"
        assert _parse(r.json()["next_ship_date"]) >= datetime.now(timezone.utc) + timedelta(days=2) - timedelta(minutes=1)
        assert _act(plan_id, "resume").status_code == 400

    def test_cancel_then_locked(self, plan_id):
        r = _act(plan_id, "cancel")
        assert r.status_code == 200 and r.json()["status"] == "cancelled" and r.json()["next_ship_date"] is None
        for a, q in [("skip", None), ("resume", None), ("pause", None), ("change_qty", 2), ("cancel", None)]:
            assert _act(plan_id, a, q).status_code == 400
        assert [x for x in _list() if x["id"] == plan_id][0]["status"] == "cancelled"

    def test_bad_id_404(self):
        assert _act("not-an-id", "skip").status_code == 404
        assert _act("0" * 24, "skip").status_code == 404

    def test_other_users_plan_404(self):
        o = _create_order()  # anonymous, other email
        oid = o.get("id") or o.get("order_id") or o.get("_id")
        if not oid:
            pytest.skip(f"order id not exposed in create response keys: {list(o.keys())}")
        assert _act(oid, "skip").status_code == 404

    def test_action_401_without_bearer(self, plan_id):
        assert _act(plan_id, "skip", headers={}).status_code == 401
