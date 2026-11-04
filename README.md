# SmoothScar

SmoothScar is a mobile-first BioRNA product storefront and customer experience application. The repository contains an Expo / React Native frontend and a FastAPI backend backed by MongoDB.

> **Status:** This repository is not yet ready for an independent production launch. Several integrations still use Emergent-managed services, and checkout currently records mock payments rather than charging a payment method. See [docs/MIGRATION_STATUS.md](docs/MIGRATION_STATUS.md) before deploying.

## Project structure

- `frontend/` — Expo, React Native, Expo Router, TypeScript and web build.
- `backend/` — FastAPI application, MongoDB data access and business logic.
- `memory/PRD.md` — product requirements and historical implementation notes.
- `docs/` — deployment, security and migration guidance.

## Features currently represented in the codebase

- Product catalog and configurable pricing.
- Order creation and order history.
- Customer accounts, including Apple sign-in and an Emergent-mediated Google sign-in flow.
- Auto-Ship subscription management logic.
- Referral codes and review rewards.
- Clinic partner applications and admin review.
- Customer reviews, progress tracking and photo uploads.
- Admin views for orders, reviews, partners, products and pricing.
- Email and push reminder workflows.

Feature presence in source code does not mean every third-party integration is configured or production-ready.

## Local development

### Backend

Use Python 3.11+ (confirm compatibility with the pinned dependencies in `backend/requirements.txt`).

```bash
cd backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn server:app --reload --host 127.0.0.1 --port 8001
```

Set a reachable MongoDB connection string and database name in `backend/.env`. Do not use production customer data in a development database.

### Frontend

```bash
cd frontend
yarn install
```

Create `frontend/.env` with the public backend URL:

```dotenv
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8001
```

Then run:

```bash
yarn web
```

For a physical device, replace the loopback address with the development machine's LAN address or a secure development URL. Expo public environment variables are embedded in the client bundle; never put secrets in an `EXPO_PUBLIC_*` variable.

## Configuration

- Backend variable names and placeholders: [backend/.env.example](backend/.env.example).
- Deployment and integration status: [docs/MIGRATION_STATUS.md](docs/MIGRATION_STATUS.md).
- Security checklist: [docs/SECURITY.md](docs/SECURITY.md).

Never commit `.env`, API keys, OAuth client secrets, database credentials, signing keys, payment secrets, or customer data.

## Important production limitations

1. **Payments:** the current order model uses `mock_paid`. No live payment processor is wired into checkout. Do not accept real orders or describe checkout as live payment processing until payment authorization, webhooks, refunds, and subscription billing are implemented and tested.
2. **Email, push, photo storage and Google login:** the current implementation depends on Emergent-managed endpoints and credentials. These must be replaced or independently provisioned.
3. **Database:** back up and migrate MongoDB data with a tested restore procedure before switching hosts.
4. **Mobile publishing:** the current iOS bundle ID and Android package name contain Emergent branding. Choose identifiers owned by the app publisher before creating store builds.
5. **Email domain:** verify sender-domain DNS, mailbox delivery and reply-to handling before enabling transactional messages.

## Safe migration workflow

Work on a feature branch, keep `main` unchanged until reviewed, and test against staging services with synthetic data. Do not delete the existing integrations until replacements have been configured and verified. Use the checklist in [docs/MIGRATION_STATUS.md](docs/MIGRATION_STATUS.md).
