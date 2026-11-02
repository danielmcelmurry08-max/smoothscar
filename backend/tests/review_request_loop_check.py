# Iteration 8: review_request_loop check — insert old orders directly in Mongo; run with arg "insert" then "check" after backend restart
import os
import sys
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
NUMS = ["TEST-RRQ-0001", "TEST-RRQ-0002", "TEST-RRQ-0003"]

if sys.argv[1] == "insert":
    db.orders.delete_many({"order_number": {"$in": NUMS}})
    db.reviews.delete_many({"order_number": {"$in": NUMS}})
    old = (datetime.now(timezone.utc) - timedelta(days=22)).isoformat()
    new = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
    base = {"plan": "one_time", "plan_name": "One box", "quantity": 1, "unit_price": 300, "subtotal": 300, "shipping": 0,
            "total": 300, "currency": "SGD", "payment_method": "card", "payment_status": "mock_paid"}
    cust = {"full_name": "TEST_Loop", "phone": "+6591234567", "address": "1 Orchard Rd", "postal_code": "238823"}
    db.orders.insert_many([
        {**base, "order_number": NUMS[0], "created_at": old, "email_key": "delivered@resend.dev",
         "customer": {**cust, "email": "delivered+rrq1@resend.dev"}},
        {**base, "order_number": NUMS[1], "created_at": old, "email_key": "delivered@resend.dev",
         "customer": {**cust, "email": "delivered+rrq2@resend.dev"}},
        {**base, "order_number": NUMS[2], "created_at": new, "email_key": "delivered@resend.dev",
         "customer": {**cust, "email": "delivered+rrq3@resend.dev"}},
    ])
    db.reviews.insert_one({"order_number": NUMS[1], "status": "rejected", "rating": 5, "display_name": "TEST", "body": "x" * 12,
                           "customer_email": "delivered+rrq2@resend.dev", "created_at": old})
    print("inserted")
else:
    for n in NUMS:
        o = db.orders.find_one({"order_number": n})
        print(n, o.get("review_request_status"), o.get("review_request_at"))
    others = db.orders.count_documents({"review_request_status": {"$exists": True}, "order_number": {"$nin": NUMS}})
    print("other orders touched:", others)
    if sys.argv[1] == "cleanup":
        db.orders.delete_many({"order_number": {"$in": NUMS}})
        db.reviews.delete_many({"order_number": {"$in": NUMS}})
        print("cleaned")
