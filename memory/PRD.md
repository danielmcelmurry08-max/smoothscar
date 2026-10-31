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

## Backlog
- P0: Replace placeholder before/after and product photos with real clinical photos
- P1: Real payments (Stripe / Apple Pay / Google Pay), order confirmation emails, clinic partner enquiry form
- P2: Admin order dashboard, reviews, WhatsApp chat button
