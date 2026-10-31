# Unit tests for push_service._due_reminders scheduling logic (no network)
import os
import sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from push_service import _due_reminders  # noqa: E402

SGT = ZoneInfo("Asia/Singapore")


def _order(plan="one_time", qty=1, start=None, **extra):
    start = start or datetime(2026, 1, 10, 10, 0, tzinfo=SGT)
    return dict({"_id": "o1", "plan": plan, "quantity": qty,
                 "reminders_started_at": start.astimezone(timezone.utc).isoformat()}, **extra)


def _kinds(o, now):
    return [k for k, _, _ in _due_reminders(o, now)]


def _at(day, h, m=0, base=datetime(2026, 1, 10, tzinfo=SGT)):
    return (base + timedelta(days=day)).replace(hour=h, minute=m)


def test_nightly_before_and_after_2130():
    o = _order()
    assert "nightly" not in _kinds(o, _at(0, 21, 29))
    assert "nightly" in _kinds(o, _at(0, 21, 30))


def test_nightly_once_per_day():
    o = _order(last_nightly_date="2026-01-10")
    assert "nightly" not in _kinds(o, _at(0, 22))
    assert "nightly" in _kinds(o, _at(1, 22))


def test_nightly_idempotency_key_has_date():
    out = _due_reminders(_order(), _at(0, 22))
    key = [k for kind, _, k in out if kind == "nightly"][0]
    assert key == "nightly-o1-2026-01-10"


def test_nightly_stops_after_regimen_one_time():
    o = _order(qty=1)
    nights = [d for d in range(0, 12) if "nightly" in _kinds(o, _at(d, 21, 45))]
    assert nights == list(range(0, 7))


def test_nightly_count_when_started_late_evening():
    # Order placed 23:00 SGT: how many nightly reminders for a 1-box (7 patch) regimen?
    o = _order(qty=1, start=datetime(2026, 1, 10, 23, 0, tzinfo=SGT))
    fired = [d for d in range(0, 12) if "nightly" in _kinds(o, _at(d, 23, 30))]
    fired_2145 = [d for d in range(1, 12) if "nightly" in _kinds(o, _at(d, 21, 45))]
    total = len(set([0] + fired_2145)) if 0 in fired else len(fired_2145)
    assert total == 7, f"expected 7 nightly reminders, got {total} (nights {[0] + fired_2145})"


def test_reorder_one_time_qty2():
    o = _order(qty=2)  # 14 days
    assert "reorder" not in _kinds(o, _at(11, 12))
    assert "reorder" in _kinds(o, _at(12, 12))
    assert "reorder" not in _kinds(dict(o, reorder_sent=True), _at(13, 12))


def test_subscribe_ship_notice_cycles_and_no_reorder():
    o = _order(plan="subscribe", qty=2)
    assert _kinds(o, _at(11, 12)) == []
    assert _kinds(o, _at(12, 12)) == ["ship"]
    assert _kinds(dict(o, ship_notice_cycle=0), _at(13, 12)) == []
    assert _kinds(dict(o, ship_notice_cycle=0), _at(26, 12)) == ["ship"]
    # nightly continues indefinitely for subscriptions
    assert "nightly" in _kinds(o, _at(40, 22))
    assert "reorder" not in _kinds(o, _at(40, 22))
