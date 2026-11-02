"""Emergent managed email (Resend) — send helper + guardrail gate + server-side templates."""
import os
import asyncio
import re
import ipaddress
import logging
import time
from collections import defaultdict, deque
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlencode, urlparse

import httpx
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
CONTACT_EMAIL = os.environ["CONTACT_EMAIL"]
SITE_URL = os.environ["SITE_URL"]
SITE_HOST = urlparse(SITE_URL).hostname or ""

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> str:
    """Send a transactional email with retry on provider rate limits. Never raises; returns a status string."""
    try:
        _assert_safe_email(subject, html)
    except ValueError as e:
        logger.error(f"Email blocked by guardrail: {e}")
        return "failed:guardrail"
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    for attempt in range(4):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                         headers={"X-Email-Key": EMAIL_KEY}, json=payload)
            if resp.status_code == 429 and attempt < 3:
                await asyncio.sleep(5 * (2 ** attempt))
                continue
            resp.raise_for_status()
            email_id = resp.json().get("id")
            logger.info(f"Email sent ({subject}) id={email_id}")
            return "sent"
        except httpx.HTTPStatusError as e:
            try:
                body = e.response.json()
            except ValueError:
                body = {}
            code = body.get("code") or str(e.response.status_code)
            if code in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
                logger.warning(f"Email paused: {code} ({e.response.status_code}): {body.get('message', '')}")
            else:
                logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
            return f"failed:{code}"
        except Exception as e:
            logger.error(f"Email send error: {e}")
            if attempt < 3:
                await asyncio.sleep(3)
                continue
            return "failed:network"
    return "failed:rate_limited"


# ---------------- Rate limit (in-memory, per key) ----------------
_hits: dict[str, deque] = defaultdict(deque)


def rate_limited(key: str, limit: int, window: int = 3600) -> bool:
    now = time.time()
    q = _hits[key]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        return True
    q.append(now)
    return False


# ---------------- Templates ----------------
BRAND = "#004B87"
INK = "#1C1C1E"
MUTED = "#6E6E73"


def _shell(title: str, inner: str) -> str:
    brand = escape(EMAIL_FROM_NAME)
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:24px 0">'
        f'<tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'style="max-width:560px;background:#FFFFFF;border-radius:16px;font-family:Helvetica,Arial,sans-serif;color:{INK}">'
        f'<tr><td style="padding:28px 28px 8px"><span style="font-size:20px;font-weight:900;letter-spacing:-0.3px">BioRNA</span>'
        f'<span style="font-size:20px;font-weight:400"> Antiscar</span></td></tr>'
        f'<tr><td style="padding:8px 28px 0"><h1 style="margin:0;font-size:24px;line-height:30px;color:{INK}">{escape(title)}</h1></td></tr>'
        f'<tr><td style="padding:16px 28px 28px;font-size:15px;line-height:23px">{inner}</td></tr>'
        f'<tr><td style="padding:20px 28px;border-top:1px solid #E5E5EA;font-size:12px;line-height:18px;color:{MUTED}">'
        f'Sent by {brand} · Developed from research at Lee Kong Chian School of Medicine, Singapore.<br>'
        f'Questions? <a href="mailto:{escape(CONTACT_EMAIL)}" style="color:{BRAND}">{escape(CONTACT_EMAIL)}</a> · '
        f'<a href="{escape(SITE_URL)}" style="color:{BRAND}">{escape(SITE_HOST)}</a><br>'
        f'We never ask for your password or card details by email.</td></tr>'
        f'</table></td></tr></table>'
    )


def _rows(rows: list[tuple[str, str]]) -> str:
    cells = "".join(
        f'<tr><td style="padding:8px 0;color:{MUTED};font-size:14px;vertical-align:top">{escape(k)}</td>'
        f'<td style="padding:8px 0;font-size:14px;text-align:right;font-weight:600">{escape(v)}</td></tr>'
        for k, v in rows
    )
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">{cells}</table>'


PAY_LABEL = {"apple_pay": "Apple Pay", "google_pay": "Google Pay", "card": "Card"}


def order_confirmation_email(order) -> tuple[str, str]:
    c = order.customer
    rows = [("Order number", order.order_number), ("Plan", order.plan_name)]
    if order.interval:
        rows.append(("Delivery", order.interval))
    rows += [
        ("Quantity", f"{order.quantity} box{'es' if order.quantity > 1 else ''} × ${order.unit_price:,}"),
        ("Shipping", "Free"),
        ("Payment", PAY_LABEL.get(order.payment_method, "Card")),
        ("Ship to", f"{c.full_name}, {c.address}, S{c.postal_code}"),
    ]
    if c.clinic_name:
        rows.insert(1, ("Clinic", c.clinic_name))
    if order.discount:
        rows.append((order.discount_label or "Discount", f"−${order.discount:,}"))
    share = (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px dashed {BRAND};border-radius:12px">'
        f'<tr><td style="padding:16px;font-size:14px;line-height:21px;color:{INK}"><strong>Give $25, get a free box.</strong> '
        f'Share your code <strong style="color:{BRAND};letter-spacing:1px">{escape(order.referral_code)}</strong> — friends get $25 off their first order, '
        f'and you get a free box for every 3 friends who buy.</td></tr></table>'
    ) if order.referral_code else ""
    inner = (
        f'<p style="margin:0">Hi {escape(c.full_name.split(" ")[0])}, thank you for your order. '
        f'We&rsquo;re preparing your BioRNA-C micro-tips patches for dispatch within 1–2 working days.</p>'
        f'{_rows(rows)}'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E5F0FA;border-radius:12px">'
        f'<tr><td style="padding:16px;font-size:15px;font-weight:700;color:{BRAND}">Total</td>'
        f'<td style="padding:16px;text-align:right;font-size:20px;font-weight:900;color:{INK}">${order.total:,}</td></tr></table>'
        f'{share}'
        f'<p style="margin:20px 0 0;font-size:14px;color:{MUTED}"><strong style="color:{INK}">Before your first patch:</strong> take a photo of your scar in good light. '
        f'It stays private, and in a few weeks you can compare it with your results.</p>'
        f'<p style="margin:12px 0 0;font-size:14px;color:{MUTED}"><strong style="color:{INK}">How to use (best before bed):</strong> clean and dry the skin, '
        f'apply the patch on the scar and press gently for 30 seconds. Leave on for 8–12 hours, then replace daily until satisfied. '
        f'Do not use on open wounds.</p>'
    )
    return f"Your {EMAIL_FROM_NAME} order {order.order_number} is confirmed", _shell("Order confirmed", inner)


def referral_reward_email(reward_code: str) -> tuple[str, str]:
    inner = (
        f'<p style="margin:0">Three friends have bought BioRNA Antiscar with your referral code. Thank you for sharing!</p>'
        f'<p style="margin:16px 0 0">Here is your code for <strong>1 free box</strong> — enter it at checkout on your next order:</p>'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#E5F0FA;border-radius:12px">'
        f'<tr><td align="center" style="padding:20px;font-size:26px;font-weight:900;letter-spacing:3px;color:{BRAND}">{escape(reward_code)}</td></tr></table>'
        f'<p style="margin:16px 0 0;font-size:14px;color:{MUTED}">Keep sharing your referral code — every 3 friends earns another free box.</p>'
    )
    return f"You earned a free box of {EMAIL_FROM_NAME}", _shell("You earned a free box", inner)


def clinic_application_email(app) -> tuple[str, str]:
    rows = [
        ("Practice / business", app.clinic_name),
        ("Credentials", app.credentials),
        ("Email", app.email),
        ("Phone", app.phone),
        ("Contact person", app.contact_name or "—"),
        ("Role", app.role or "—"),
        ("Location", app.location or "—"),
        ("Practice type", app.practice_type or "—"),
        ("Est. boxes / month", app.monthly_volume or "—"),
    ]
    inner = (
        f'<p style="margin:0">A new practice has applied to the BioRNA Provider Partner Program.</p>'
        f'{_rows(rows)}'
        f'<p style="margin:0;font-size:14px;color:{MUTED}">Message</p>'
        f'<p style="margin:4px 0 0;font-size:15px;white-space:pre-wrap">{escape(app.message or "—")}</p>'
    )
    return f"New clinic partner application: {app.clinic_name}", _shell("New clinic partner application", inner)


def _button(href: str, label: str) -> str:
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr>'
        f'<td style="background:{BRAND};border-radius:999px"><a href="{escape(href)}" '
        f'style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none">{escape(label)}</a></td></tr></table>'
    )


def review_request_email(order: dict, percent: int) -> tuple[str, str]:
    first = order["customer"]["full_name"].split(" ")[0]
    link = f"{SITE_URL.rstrip('/')}/review?{urlencode({'order': order['order_number'], 'email': order['customer']['email'], 'name': first})}"
    inner = (
        f'<p style="margin:0">Hi {escape(first)}, it&rsquo;s been about three weeks since your order {escape(order["order_number"])}. '
        f'How is your scar looking?</p>'
        f'<p style="margin:16px 0 0">Share a 1–5 star rating and a few words about your results. You can add your before photo and an after photo, too.</p>'
        f'<p style="margin:16px 0 0">As a thank-you, once your review is approved we&rsquo;ll email you a code for '
        f'<strong>{percent}% off a box</strong>.</p>'
        f'{_button(link, "Rate my results")}'
        f'<p style="margin:20px 0 0;font-size:14px;color:{MUTED}">Your photos stay private unless you add them to your review. '
        f'Only your chosen name, rating, review and photos are shown publicly.</p>'
    )
    return f"How are your results with {EMAIL_FROM_NAME}?", _shell("How are your results?", inner)


def review_reward_email(name: str, code: str, percent: int) -> tuple[str, str]:
    inner = (
        f'<p style="margin:0">Hi {escape(name)}, thank you for reviewing BioRNA Antiscar. Your review is now live.</p>'
        f'<p style="margin:16px 0 0">Here is your code for <strong>{percent}% off one box</strong> at full price. Enter it at checkout on your next order:</p>'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#E5F0FA;border-radius:12px">'
        f'<tr><td align="center" style="padding:20px;font-size:26px;font-weight:900;letter-spacing:3px;color:{BRAND}">{escape(code)}</td></tr></table>'
        f'<p style="margin:16px 0 0;font-size:14px;color:{MUTED}">Single use, on any plan. It can&rsquo;t be combined with another code.</p>'
    )
    return f"Your {percent}% off code from {EMAIL_FROM_NAME}", _shell("Thank you for your review", inner)
