# Progress-photo reminder loop check: inserts aged orders, restarts backend, verifies week 1/2 emails sent once.
# Usage: python tests/progress_reminder_check.py insert   -> then: sudo supervisorctl restart backend; sleep 15
#        python tests/progress_reminder_check.py verify
#        (restart again + verify again to confirm no duplicate sends)
import sys
import uuid
from datetime import datetime, timedelta, timezone

from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
CASES = {"d8": (8, [1]), "d11": (11, [1]), "d13": (13, None), "d15": (15, [2]), "d18": (18, [2]), "d5": (5, None), "d20": (20, None)}

if sys.argv[1] == "insert":
    db.orders.delete_many({"order_number": {"$regex": "^TESTPR-"}})
    now = datetime.now(timezone.utc)
    for key, (days, _) in CASES.items():
        email = f"delivered+prog{key}@resend.dev"
        db.orders.insert_one({
            "order_number": f"TESTPR-{key.upper()}-{uuid.uuid4().hex[:4].upper()}", "email_key": email,
            "customer": {"full_name": "TEST Reminder User", "email": email, "phone": "+6591234567", "address": "1 Test Rd", "postal_code": "238823"},
            "created_at": (now - timedelta(days=days)).isoformat(), "plan": "one_time", "quantity": 1,
            "review_request_status": "skipped:test",
        })
    print("inserted", len(CASES))
else:
    ok = True
    for o in db.orders.find({"order_number": {"$regex": "^TESTPR-"}}):
        key = o["order_number"].split("-")[1].lower()
        expected = CASES[key][1]
        sent = o.get("progress_reminders_sent")
        status = o.get("progress_email_status")
        good = sent == expected
        ok &= good
        print(f"{'OK ' if good else 'BAD'} {key}: sent={sent} expected={expected} status={status}")
    print("ALL OK" if ok else "FAILURES")
