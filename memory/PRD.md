# BioRNA Antiscar — PRD

## Original problem statement
Premium medical-cosmetic D2C single-product landing page (mobile web first) for "BioRNA Antiscar" (LKCMedicine, Singapore). It should feel clinical but human (like Morphiya or Thorne): white and light-grey surfaces, charcoal text, RNA Blue #004B87. Sections: Hero with a sticky "Order Now — Try BioRNA-C" button and Apple/Google Pay badges; 3 "Are you feeling" cards; clinical stats (95% / 88% / 8 of 10) with a citation and before/after images; a tiered checkout widget (Subscribe & Save vs Clinic & Multi-Pack); trust logos; How It Works / How to Use / FAQs dropdowns; a footer with enquiry@BioRNA.sg and a disclaimer. Semantic, crawlable markup.

## User choices
- Mock checkout, with orders saved to the database and a confirmation screen
- Before/after shown as a draggable slider
- Pricing: single box S$300 (D2C); provider partners S$185 per box, minimum 2. Subscribe price (S$270 every 4 weeks) is an assumption.

## Architecture
- Expo Router (web + native): `app/index.tsx` (landing), `app/checkout.tsx`, `app/order/[id].tsx`
- Components in `src/components/*`; text and prices in `src/content.ts`; Satoshi fonts; Phosphor icons
- FastAPI: `GET /api/pricing`, `POST /api/orders` (server-side pricing and validation, atomic order counter, unique order number), `GET /api/orders/{id}`
- MongoDB collections: orders, counters

## Implemented (2026-06)
- Every landing section, the sticky CTA, the slider with two cases, the tiered widget, accordions, footer, and SEO title/meta
- Checkout: plan summary, quantity and tier picker, Apple Pay / Google Pay / Card (mock), form validation, confirmation screen
- Testing: iteration 1 found 19/19 backend tests passing. The issues it raised (web mouse drag on the slider, 404 retries, order-number race, label mismatches) were fixed afterwards. Only the slider fix was re-checked, by a screenshot test; the rest has not been re-tested.

## Iteration 2 (2026-06)
- Order confirmation emails sent through Emergent managed email (Resend). Retries on provider rate limits; result saved as `email_status` on each order.
- Clinic Partner form (`/clinic-apply`), reached from the clinic tab and the footer. Saves to `clinic_applications` and emails ADMIN_EMAIL=info@smoothscar.com. That inbox is currently rejected as undeliverable, so applications are saved but not emailed.
- Real photos pulled from the user's PDFs (`assets/images/clinical/`): C-section, knee keloid and wrist keloid before/after, the product box, NTU and NSC logos, and the awards panel. Testimonials and How It Works / How to Use / FAQ copy taken from the PDFs.
- Abuse limits: per-IP (rightmost X-Forwarded-For) and per-email limits, counted only after validation; global cap on clinic applications.
- Env: CONTACT_EMAIL / EMAIL_REPLY_TO = enquiry@BioRNA.sg, SITE_URL = https://smoothscar.com
- Testing: iteration 2 passed 44/44 backend tests. Its follow-ups (email retry and status, rate-limit hardening, email copy, contact emails, touch targets, fixed slider height, dismissTo) were then fixed. Only spot-checked with one curl and a screenshot; not re-run with the testing agent.

## Iteration 3 (2026-06)
- Pricing: single box $300; 2-box bundle $275 each ($550, save $50); Auto-Ship every 2 weeks at $275/box (2 or 4 boxes). Prices show "$" rather than "S$". The public $185 clinic checkout was removed.
- Provider Partners tab now has a single button that opens `/clinic-apply`, a separate landing page. Required: practice/business name, email, phone, credentials. Everything else is optional.
- Emergent managed push (`push_service.py`):
  - `/api/register-push`; `/api/orders/{id}/reminders` (POST/DELETE)
  - Order-confirmed push when reminders are turned on
  - Background loop: 9:30pm SGT nightly reminder (counted in SGT calendar days), reorder alert 2 days before patches run out, and a 2-day shipment notice for Auto-Ship. Failed sends wait 30 minutes before retrying.
  - Frontend: module-scope handler and channel, tap handlers, re-registration on every app open, ReminderCard on the order page (asks permission; Open Settings when blocked), weekly nudge
- EMERGENT_PUSH_KEY=placeholder until deploy. No google-services.json yet, so Android pushes need it before the Android build.
- Testing: iteration 3 passed 26/27 backend tests and every frontend flow. Its follow-ups were fixed afterwards (calendar-day count, removed clinic checkout, register-push status check, atomic opt-in, retry backoff, 44pt chips, sticky CTA hidden over the widget). Of these, only the reminder unit tests (7/7), the clinic-plan rejection and the sticky-CTA hiding were re-checked; the full suite was not re-run.
- P0: Fix mail records for info@smoothscar.com, or switch to a working inbox
- P1: Real payments (Stripe / Apple Pay / Google Pay); admin view of orders and applications
- P2: Hero photo of a real BioRNA user, WhatsApp chat button

## Backlog
- P0: google-services.json from Firebase (package com.emergent.biornacscar.bqs75v); a working inbox instead of info@smoothscar.com
- P1: Real payments; admin view of orders and applications
- P2: Hero photo of a real user, scar progress diary

## Iteration 4 (2026-06)
- Referral program (`backend/referrals.py`):
  - Every customer gets a BIOxxxxxx code. Friends get $25 off their first order (one claim per email key, atomic). Customers can't use their own code.
  - Every 3 friends who buy earn the referrer a single-use FREExxxxxx code for 1 free box, sent by email and push.
  - Endpoints: `/api/codes/{code}` (preview), `/api/referrals/{code}` (progress)
  - Checkout: code field, pre-filled and applied automatically from `?code=`. The landing banner shows only for valid codes.
  - Confirmation page: share card with progress toward the next free box
- Team admin screen `/admin` (passcode ADMIN_PASSCODE in backend .env; see test_credentials.md) lists provider applications, because info@smoothscar.com bounces.
- Testing: iteration 4 passed 9/9 new backend tests and every frontend flow. Fixes made afterwards: auto-apply of `?code=`, banner shows only for valid codes, honest "copied" state, duplicate-key and parallel-claim race fixes, admin email chip no longer cut off. Re-checked so far: the parallel-claim curl test (passed) and the reminder unit tests (7/7). The auto-apply screenshot check was still running when this was written. 10 older tests from iterations 1–3 are stale after the pricing and form changes and still need updating.
- Pending from the user: google-services.json (Android push)

## Iteration 5 (2026-06)
- Optional customer accounts (`backend/auth.py`): Emergent managed Google sign-in (all platforms) and Sign in with Apple (iOS only; Apple token checked against Apple's keys for APPLE_AUDIENCES; only Apple-verified emails are trusted). Bearer sessions last 7 days, stored with the app's secure storage helpers.
- `/account`: sign-in panel, or profile with Auto-Ship summary, referral card, free-box codes, My orders and sign out. Opened from the account icon on the hero.
- Orders placed while signed in are linked to the user. My orders also shows orders placed with the exact same email. Checkout pre-fills name and email.
- Testing: iteration 5 passed 14/14 backend tests and every UI flow. The Apple email takeover fix and the direct-load checkout pre-fill fix were re-checked: pytest 14/14 and a pre-fill check on a direct `/checkout` load. The Google sign-in error message and the 502 for network errors were not re-checked.
- Push notifications: already integrated in iteration 3 (re-request needed no changes)

## Iteration 6 (2026-06)
- Manage Auto-Ship (`backend/autoship.py`, `AutoShipCard.tsx`): signed-in customers pause, resume, skip next, change boxes (2 or 4) or cancel (inline confirm) from /account. Next ship date defaults to order date + 14 days; fulfilment is simulated by the reminder loop, which rolls dates forward. Paused and cancelled plans get no nightly or ship pushes. The ship notice now opens /account.
- Updates are guarded against two changes at once (409 if the plan changed meanwhile); the list shows active plans first.
- Frontend: error notices in red, refresh after a failed action, Auto-Ship data tied to the signed-in user, cache cleared on sign-out, loading and retry states.
- Testing: iteration 6 passed 22/22 backend tests and every UI flow. Fixes made afterwards: error colours, refresh after failure, data tied to the user, two-at-once updates, list order and limit, empty-status handling. Re-checked so far: the backend tests pass again (22/22); the UI fixes have not been re-checked.

## Iteration 7 (2026-06)
- Partner inbox: ADMIN_EMAIL=partner@smoothscar.com. smoothscar.com has NO MX records, so the email provider rejects it as undeliverable; applications are saved and shown in /admin → Partners. Needs email hosting/MX set up on smoothscar.com.
- Reviews (`backend/reviews.py`): verified buyers only (order number + matching email), 1 per order, 1–5 stars, name, optional headline/scar type. Pending until approved in /admin. Public `GET /api/reviews` (average, count, distribution, latest 30 approved). Landing section `Reviews.tsx`, form `/review`, link from order page.
- Team dashboard `/admin` (`backend/admin.py`, `src/components/admin/*`): tabs Orders / Reviews / Partners / Pricing.
  - Orders: period filter, totals, region from SG postal sector, time-of-day (SGT) and by-hour charts, search, CSV export, full customer details, account link, Auto-Ship status.
  - Pricing: live single / bundle / Auto-Ship prices stored in db.settings (`backend/pricing.py`); `/api/pricing` and order creation use them; existing Auto-Ships keep their price.
- Removed leftover clinic checkout plan from the frontend. Copy spelling/grammar pass.
