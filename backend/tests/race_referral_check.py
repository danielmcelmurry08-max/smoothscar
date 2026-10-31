# Ad-hoc concurrency probe: parallel first orders for same new customer (referral code creation race + double friend discount)
import os, sys, uuid, concurrent.futures as cf
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
ENV = dotenv_values("/app/backend/.env")
db = MongoClient(ENV["MONGO_URL"])[ENV["DB_NAME"]]
uid = uuid.uuid4().hex[:8]


def post(email, code=None):
    body = {"plan": "one_time", "quantity": 1, "payment_method": "card",
            "customer": {"full_name": "TEST_Race", "email": email, "phone": "+6591234567", "address": "1 Orchard Road", "postal_code": "238823"}}
    if code:
        body["code"] = code
    r = requests.post(f"{BASE}/api/orders", json=body, timeout=30)
    return r.status_code, (r.json().get("referral_code"), r.json().get("discount")) if r.ok else r.text[:80]


keys = []
# 1) parallel orders for a brand-new customer
e = f"testrace{uid}@example.com"; keys.append(e)
with cf.ThreadPoolExecutor(3) as ex:
    print("new-customer parallel:", list(ex.map(lambda _: post(e), range(3))))
code = db.referrals.find_one({"owner_key": e})
code = code and code["code"]
# 2) parallel first orders for a friend using referral
f = f"testracefriend{uid}@example.com"; keys.append(f)
with cf.ThreadPoolExecutor(3) as ex:
    print("friend parallel w/ code:", list(ex.map(lambda _: post(f, code), range(3))))
ref = db.referrals.find_one({"code": code})
print("successful_count after 1 friend:", ref and ref["successful_count"])
db.orders.delete_many({"email_key": {"$in": keys}})
db.referrals.delete_many({"owner_key": {"$in": keys}})
db.reward_codes.delete_many({"referral_code": code})
