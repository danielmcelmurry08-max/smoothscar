# SmoothScar independent migration status

Last reviewed: 2026-11-02

This document reflects source inspection only. The app has not yet been built, run, tested end-to-end, or deployed from this branch.

## Current architecture

- Frontend: Expo / React Native / Expo Router / TypeScript.
- Backend: FastAPI / Python.
- Database: MongoDB via Motor.
- API prefix: `/api`.
- Client backend origin: `EXPO_PUBLIC_BACKEND_URL`.

## Confirmed platform dependencies and blockers

| Capability | Current code behavior | Independent-launch work |
|---|---|---|
| Email | `backend/email_service.py` calls Emergent integration proxy with `EMERGENT_EMAIL_KEY`. | Implement a direct provider adapter (e.g. Resend API), move credentials to host secrets, verify sender DNS and delivery. |
| Push | `backend/push_service.py` calls Emergent integration proxy with `EMERGENT_PUSH_KEY`. | Choose a supported push provider; configure Expo push credentials / APNs / FCM as appropriate; test device registration and delivery. |
| Photo storage | `backend/storage.py` initializes Emergent object storage using `EMERGENT_LLM_KEY`. | Migrate existing objects and metadata to owned S3-compatible storage; preserve private/public access rules and signed access. |
| Google sign-in | `backend/auth.py` exchanges an Emergent session ID through an Emergent demo backend. | Implement direct Google OAuth / OIDC validation and account linking; test web and native redirect flows. |
| Apple sign-in | Backend validates Apple identity tokens against Apple's JWKS. | Register owned bundle IDs, services IDs and redirect URLs; verify audience configuration. |
| Payments | Orders default to `payment_status="mock_paid"`; current checkout does not charge a card. | Implement a payment provider, server-side payment intent/session creation, verified webhooks, idempotency, refunds, and subscription lifecycle. |
| Database | Backend requires `MONGO_URL` and `DB_NAME`. | Provision managed MongoDB, create least-privilege credentials, configure network restrictions, backups and restore test. |
| Hosting | No portable production deployment manifest was found in the inspected root paths. | Select an API host and web host; configure health checks, HTTPS, logs, secrets and staging. |
| Mobile identity | `frontend/app.json` uses Emergent-branded iOS and Android identifiers. | Select publisher-owned identifiers and update OAuth / push registrations before store builds. |
| Domain email | Historical PRD notes delivery / MX configuration problems for SmoothScar mailboxes. | Verify DNS records and actual inbox delivery for sender, reply-to, support and admin addresses. |

## Recommended sequence

### Stage 0 — secure and preserve
- [ ] Rotate the admin passcode and any API keys or passwords that have ever appeared in source, documentation, logs or Git history.
- [ ] Run GitHub secret scanning / a full-history secret scanner. Search results alone are not a complete scan.
- [ ] Keep the default branch unchanged; use a migration branch and pull requests.
- [ ] Create an encrypted backup of the MongoDB database and object storage; perform a restore test.
- [ ] Confirm rights to all product images, copy, logos and other assets before moving them to a new host.

### Stage 1 — establish a clean independent development environment
- [ ] Provision a development MongoDB database with synthetic data.
- [ ] Configure backend environment variables from `backend/.env.example`.
- [ ] Configure `frontend/.env` with `EXPO_PUBLIC_BACKEND_URL`.
- [ ] Install pinned Python and JavaScript dependencies; record runtime versions.
- [ ] Run backend import checks, pytest, frontend TypeScript, lint and Expo diagnostics.
- [ ] Fix all failing tests before modifying production integrations.

### Stage 2 — remove managed-platform dependencies
- [ ] Replace Emergent email relay with direct provider integration.
- [ ] Replace Emergent object storage and migrate stored photos.
- [ ] Replace Emergent push relay and test APNs / FCM / Expo delivery.
- [ ] Replace Emergent Google session exchange with direct Google OIDC.
- [ ] Remove `emergentintegrations` after all imports and service dependencies are gone.
- [ ] Update docs and remove obsolete platform-only instructions.

### Stage 3 — payments and launch safety
- [ ] Implement real payment processing and signed webhooks.
- [ ] Add payment states such as pending, authorized, paid, failed, refunded; do not mark an order paid before verified provider confirmation.
- [ ] Implement subscription billing, cancellation, retries and webhook reconciliation if Auto-Ship is sold as recurring billing.
- [ ] Review privacy, consent, customer-data retention, access control, rate limiting and logging.
- [ ] Test order creation, duplicate webhook delivery, refunds, account access, photo permissions, reviews, referrals and admin actions.
- [ ] Confirm customer-facing product claims, terms, privacy policy and refund / shipping policies with qualified reviewers.

### Stage 4 — independent release
- [ ] Configure production web/API hosting, TLS, domain and monitoring.
- [ ] Configure production database backups and alerting.
- [ ] Update mobile app identifiers and provider registrations.
- [ ] Test a staging release with test-mode payments and test accounts.
- [ ] Cut over DNS only after smoke tests and rollback plan are ready.

## Environment variables currently observed

Backend code currently reads:

- `MONGO_URL`
- `DB_NAME`
- `ADMIN_PASSCODE`
- `EMERGENT_EMAIL_KEY`
- `EMERGENT_PUSH_KEY`
- `EMERGENT_LLM_KEY`
- `EMAIL_FROM_NAME`
- `EMAIL_REPLY_TO` (optional)
- `ADMIN_EMAIL`
- `CONTACT_EMAIL`
- `SITE_URL`
- `INTEGRATION_PROXY_URL` (optional)
- `APPLE_AUDIENCES`

The current frontend reads `EXPO_PUBLIC_BACKEND_URL`. Public-prefixed frontend variables are exposed in the client bundle and must never contain secrets.

## Not yet verified

- Full repository and Git-history secret scan.
- Successful clean install and build from a fresh machine.
- Test-suite status and runtime compatibility.
- Actual payment provider behavior.
- Actual production email, push, OAuth and object-storage behavior.
- Database and object-store backup / restore.
- Production hosting and DNS configuration.
