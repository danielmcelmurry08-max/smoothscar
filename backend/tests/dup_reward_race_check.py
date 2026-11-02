# Iteration 9: race check - concurrent approvals while reward_code is 'pending' (email slow) may issue duplicate RVW codes
import os
import random
import threading
import uuid
from pathlib import Path

import requests
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
ADM = {"X-Admin-Passcode": os.environ["ADMIN_PASSCODE"]}


def xff():
    return {"X-Forwarded-For": f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"}


email = f"delivered+race{uuid.uuid4().hex[:6]}@resend.dev"
o = requests.post(f"{BASE}/api/orders", headers=xff(), json={"plan": "one_time", "quantity": 1, "payment_method": "card", "customer": {
    "full_name": "TEST Race", "email": email, "phone": "+6591234567", "address": "1 Orchard Road", "postal_code": "238823"}}).json()
r = requests.post(f"{BASE}/api/reviews", headers=xff(), json={"order_number": o["order_number"], "email": email, "rating": 5,
                                                              "display_name": "TEST_Race", "body": "Race condition check review."})
assert r.status_code == 201, r.text
rid = next(x["id"] for x in requests.get(f"{BASE}/api/admin/reviews", headers={**ADM, **xff()}).json() if x["order_number"] == o["order_number"])
out = []


def approve():
    resp = requests.post(f"{BASE}/api/admin/reviews/{rid}", headers={**ADM, **xff()}, json={"status": "approved"}, timeout=200)
    out.append((resp.status_code, resp.text[:120]))


ts = [threading.Thread(target=approve) for _ in range(2)]
for t in ts:
    t.start()
for t in ts:
    t.join()
print("responses:", out)
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
codes = list(db.reward_codes.find({"review_id": rid}, {"_id": 0, "code": 1}))
print("codes issued for review:", codes, "DUPLICATE" if len(codes) > 1 else "OK")
requests.post(f"{BASE}/api/admin/reviews/{rid}", headers={**ADM, **xff()}, json={"status": "rejected"})
