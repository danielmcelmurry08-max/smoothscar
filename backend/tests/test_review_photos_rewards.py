# Iteration 8/9: before/after review photos, photo_token/admin_token access control, review approval 25% reward codes
import io
import os
import random
import uuid

import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")
PASS = "10F40F7B"
ADM = {"X-Admin-Passcode": PASS}
CUST = {"full_name": "TEST_PhotoReviewer", "phone": "+6591234567",
        "address": "1 Orchard Road #01-01", "postal_code": "238823"}
S = {}


def _h(extra=None):
    h = {"X-Forwarded-For": f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"}
    h.update(extra or {})
    return h


def _jpeg(color=(200, 120, 90)):
    buf = io.BytesIO()
    Image.new("RGB", (40, 40), color).save(buf, "JPEG")
    return buf.getvalue()


def _order(email, code=None):
    body = {"plan": "one_time", "quantity": 1, "payment_method": "card", "customer": dict(CUST, email=email)}
    if code:
        body["code"] = code
    return requests.post(f"{BASE_URL}/api/orders", headers=_h(), json=body)


@pytest.fixture(scope="module", autouse=True)
def orders():
    for k in ("a", "b"):
        email = f"test_ph{k}{uuid.uuid4().hex[:6]}@example.com"
        r = _order(email)
        assert r.status_code == 200, r.text
        S[k] = r.json()
        S[k + "_email"] = email
    yield
    if S.get("review_id"):
        requests.post(f"{BASE_URL}/api/admin/reviews/{S['review_id']}", headers=_h(ADM), json={"status": "rejected"})


# --- before photo after purchase ---
def test_order_create_returns_token_get_hides_it():
    assert isinstance(S["a"].get("photo_token"), str) and len(S["a"]["photo_token"]) >= 16
    assert S["a"]["photo_token"] != S["b"]["photo_token"]
    g = requests.get(f"{BASE_URL}/api/orders/{S['a']['id']}").json()
    assert g.get("photo_token") is None


def test_before_photo_requires_token():
    url = f"{BASE_URL}/api/orders/{S['a']['id']}/before-photo"
    f = lambda: {"file": ("b.jpg", _jpeg(), "image/jpeg")}
    assert requests.post(url, headers=_h(), files=f()).status_code == 422
    assert requests.post(url, headers=_h(), data={"token": "wrong"}, files=f()).status_code == 403
    assert requests.post(url, headers=_h(), data={"token": S["b"]["photo_token"]}, files=f()).status_code == 403


def test_before_photo_upload_and_order_get():
    r = requests.post(f"{BASE_URL}/api/orders/{S['a']['id']}/before-photo", headers=_h(),
                      data={"token": S["a"]["photo_token"]}, files={"file": ("b.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 201, r.text
    d = r.json()
    assert d["kind"] == "before" and len(d["id"]) == 24
    S["a_before"] = d["id"]
    g = requests.get(f"{BASE_URL}/api/orders/{S['a']['id']}").json()
    assert g["before_photo_id"] == d["id"]


def test_before_photo_bad_type_and_bad_order():
    r = requests.post(f"{BASE_URL}/api/orders/{S['a']['id']}/before-photo", headers=_h(),
                      data={"token": S["a"]["photo_token"]}, files={"file": ("b.txt", b"hello", "text/plain")})
    assert r.status_code == 400
    r = requests.post(f"{BASE_URL}/api/orders/{'0'*24}/before-photo", headers=_h(), data={"token": "x"},
                      files={"file": ("b.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 404
    r = requests.post(f"{BASE_URL}/api/orders/notanid/before-photo", headers=_h(), data={"token": "x"},
                      files={"file": ("b.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 404


def test_before_photo_too_large():
    big = b"\xff\xd8" + os.urandom(8 * 1024 * 1024 + 10)
    r = requests.post(f"{BASE_URL}/api/orders/{S['a']['id']}/before-photo", headers=_h(),
                      data={"token": S["a"]["photo_token"]}, files={"file": ("big.jpg", big, "image/jpeg")}, timeout=120)
    assert r.status_code == 413, r.status_code


# --- lookup ---
def test_lookup():
    r = requests.post(f"{BASE_URL}/api/reviews/lookup", headers=_h(),
                      json={"order_number": S["a"]["order_number"].lower(), "email": S["a_email"].upper()})
    assert r.status_code == 200, r.text
    assert r.json() == {"photo_token": S["a"]["photo_token"], "before_photo_id": S["a_before"]}
    r = requests.post(f"{BASE_URL}/api/reviews/lookup", headers=_h(),
                      json={"order_number": S["a"]["order_number"], "email": "wrong@example.com"})
    assert r.status_code == 400


# --- review-photos (form) ---
def test_review_photo_upload_after_and_b_before():
    r = requests.post(f"{BASE_URL}/api/review-photos", headers=_h(),
                      data={"order_number": S["a"]["order_number"], "email": S["a_email"], "kind": "after"},
                      files={"file": ("a.png", _jpeg((10, 200, 10)), "image/png")})
    assert r.status_code == 201, r.text
    assert r.json()["kind"] == "after"
    S["a_after"] = r.json()["id"]
    r = requests.post(f"{BASE_URL}/api/review-photos", headers=_h(),
                      data={"order_number": S["b"]["order_number"], "email": S["b_email"], "kind": "before"},
                      files={"file": ("b.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 201
    S["b_before"] = r.json()["id"]
    r = requests.post(f"{BASE_URL}/api/review-photos", headers=_h(),
                      data={"order_number": S["b"]["order_number"], "email": S["b_email"], "kind": "middle"},
                      files={"file": ("b.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 422
    r = requests.post(f"{BASE_URL}/api/review-photos", headers=_h(),
                      data={"order_number": S["b"]["order_number"], "email": "x@example.com", "kind": "after"},
                      files={"file": ("b.jpg", _jpeg(), "image/jpeg")})
    assert r.status_code == 400


# --- photo access control before approval ---
def test_photo_access_private():
    pid = S["a_before"]
    assert requests.get(f"{BASE_URL}/api/photos/{pid}").status_code == 404
    r = requests.get(f"{BASE_URL}/api/photos/{pid}", params={"token": S["a"]["photo_token"]})
    assert r.status_code == 200 and r.headers["content-type"].startswith("image/jpeg") and r.content[:2] == b"\xff\xd8"
    assert requests.get(f"{BASE_URL}/api/photos/{pid}", params={"token": S["b"]["photo_token"]}).status_code == 404
    assert requests.get(f"{BASE_URL}/api/photos/{pid}", params={"order_id": S["a"]["id"]}).status_code == 404
    assert requests.get(f"{BASE_URL}/api/photos/{pid}", params={"admin": PASS}).status_code == 404
    vt = requests.get(f"{BASE_URL}/api/admin/view-token", headers=_h(ADM))
    assert vt.status_code == 200 and PASS not in vt.json()["token"]
    tok = vt.json()["token"]
    assert requests.get(f"{BASE_URL}/api/photos/{pid}", params={"admin_token": tok}).status_code == 200
    assert requests.get(f"{BASE_URL}/api/photos/{pid}", params={"admin_token": tok[:-1] + ("0" if tok[-1] != "0" else "1")}).status_code == 404
    assert requests.get(f"{BASE_URL}/api/photos/{pid}", params={"admin_token": "1.abc"}).status_code == 404
    assert requests.get(f"{BASE_URL}/api/photos/{pid}", params={"admin_token": "garbage"}).status_code == 404
    assert requests.get(f"{BASE_URL}/api/admin/view-token", headers=_h({"X-Admin-Passcode": "WRONG"})).status_code == 401
    assert requests.get(f"{BASE_URL}/api/photos/{'0'*24}").status_code == 404
    assert requests.get(f"{BASE_URL}/api/photos/bad").status_code == 404


# --- review creation with photos ---
def _review(**kw):
    body = {"order_number": S["a"]["order_number"], "email": S["a_email"], "rating": 5,
            "display_name": "TEST_Pho", "body": "My scar faded a lot in three weeks."}
    body.update(kw)
    return requests.post(f"{BASE_URL}/api/reviews", headers=_h(), json=body)


def test_review_rejects_foreign_and_wrong_kind_photos():
    assert _review(before_photo_id=S["b_before"]).status_code == 400
    assert _review(before_photo_id=S["a_after"]).status_code == 400
    assert _review(after_photo_id=S["a_before"]).status_code == 400
    assert _review(after_photo_id="garbage").status_code == 400


def test_review_create_with_photos_and_approve_reward():
    r = _review(before_photo_id=S["a_before"], after_photo_id=S["a_after"])
    assert r.status_code == 201, r.text
    lst = requests.get(f"{BASE_URL}/api/admin/reviews", headers=_h(ADM), params={"status": "pending"}).json()
    rev = next(x for x in (lst if isinstance(lst, list) else lst.get("reviews", [])) if x["order_number"] == S["a"]["order_number"])
    S["review_id"] = rev["id"]
    r = requests.post(f"{BASE_URL}/api/admin/reviews/{rev['id']}", headers=_h(ADM), json={"status": "approved"})
    assert r.status_code == 200, r.text
    code = r.json()["reward_code"]
    assert code and code.startswith("RVW") and len(code) == 9
    S["code"] = code
    # re-approve does not issue a new code
    r2 = requests.post(f"{BASE_URL}/api/admin/reviews/{rev['id']}", headers=_h(ADM), json={"status": "approved"})
    assert r2.json()["reward_code"] == code


def test_photos_public_after_approval_and_listing():
    assert requests.get(f"{BASE_URL}/api/photos/{S['a_before']}").status_code == 200
    assert requests.get(f"{BASE_URL}/api/photos/{S['a_after']}").status_code == 200
    revs = requests.get(f"{BASE_URL}/api/reviews").json()["reviews"]
    mine = next(x for x in revs if x["id"] == S["review_id"])
    assert mine["before_photo_url"] == f"/api/photos/{S['a_before']}"
    assert mine["after_photo_url"] == f"/api/photos/{S['a_after']}"
    assert "customer_email" not in mine


def test_hide_makes_photos_private_then_reapprove_same_code():
    r = requests.post(f"{BASE_URL}/api/admin/reviews/{S['review_id']}", headers=_h(ADM), json={"status": "rejected"})
    assert r.status_code == 200
    assert requests.get(f"{BASE_URL}/api/photos/{S['a_before']}").status_code == 404
    assert requests.get(f"{BASE_URL}/api/photos/{S['a_after']}").status_code == 404
    r = requests.post(f"{BASE_URL}/api/admin/reviews/{S['review_id']}", headers=_h(ADM), json={"status": "approved"})
    assert r.json()["reward_code"] == S["code"]
    count = len([c for c in [r.json()["reward_code"]] if c])
    assert count == 1


def test_reapprove_retries_stuck_pending_code():
    from pymongo import MongoClient
    from bson import ObjectId
    db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    db.reviews.update_one({"_id": ObjectId(S["review_id"])}, {"$set": {"reward_code": "pending"}})
    r = requests.post(f"{BASE_URL}/api/admin/reviews/{S['review_id']}", headers=_h(ADM), json={"status": "approved"})
    assert r.status_code == 200, r.text
    new = r.json()["reward_code"]
    assert new and new != "pending" and new.startswith("RVW"), new
    assert new == S["code"]  # idempotent: re-issuing returns the review's existing code, never a second one
    assert db.reward_codes.count_documents({"review_id": S["review_id"]}) == 1


def test_admin_review_list_has_photos_and_code():
    lst = requests.get(f"{BASE_URL}/api/admin/reviews", headers=_h(ADM), params={"status": "all"}).json()
    rows = lst if isinstance(lst, list) else lst.get("reviews", [])
    mine = next(x for x in rows if x["id"] == S["review_id"])
    assert mine["reward_code"] == S["code"]
    S["admin_row"] = mine
    print("ADMIN ROW", mine)


# --- RVW code redemption ---
def test_code_preview_and_single_use_redemption():
    single = requests.get(f"{BASE_URL}/api/pricing").json()["prices"]["single"]
    p = requests.get(f"{BASE_URL}/api/codes/{S['code'].lower()}")
    assert p.status_code == 200, p.text
    assert p.json()["kind"] == "review" and p.json()["percent"] == 25
    email = f"test_rvw{uuid.uuid4().hex[:6]}@example.com"
    r = _order(email, code=S["code"])
    assert r.status_code == 200, r.text
    o = r.json()
    assert o["discount"] == round(single * 0.25)
    assert o["total"] == single - round(single * 0.25)
    assert o["discount_label"] == "Review thank-you: 25% off one box"
    assert o["applied_code"] == S["code"]
    r2 = _order(f"test_rvw{uuid.uuid4().hex[:6]}@example.com", code=S["code"])
    assert r2.status_code == 400
    assert requests.get(f"{BASE_URL}/api/codes/{S['code']}").status_code == 404
