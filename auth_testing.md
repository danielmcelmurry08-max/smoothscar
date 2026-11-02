# Auth testing (Google via Emergent + Sign in with Apple)

- Seeded test user: user_id `user_test0001`, email delivered+auth@resend.dev
- Seeded session (Bearer): `st_test_session_0001` (expires after 7 days; re-seed with mongosh if needed)
- GET /api/auth/me with Bearer → user; without → 401
- GET /api/me/orders, /api/me/referral need Bearer
- POST /api/auth/apple with a bad token → 401 (a real Apple token can only be tested on an iOS device)
- POST /api/auth/session with a bad session_id → 401 (real Google flow: tap "Continue with Google" on /account)
- APPLE_AUDIENCES = com.emergent.biornacscar.bqs75v,host.exp.Exponent
