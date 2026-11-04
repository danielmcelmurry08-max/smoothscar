# Emergent-hosted SmoothScar: credential cutover runbook

**Status:** Instructions prepared; no live keys rotated. Hosting: Emergent. Do not paste credentials in GitHub or chat.

## Immediate containment
1. In Emergent, locate the SmoothScar/BioRNA project and its backend environment/secrets settings. If unavailable, ask Emergent support for the project's production secrets manager and revocation procedure.
2. Replace the **ADMIN_PASSCODE** backend secret with a cryptographically random, unique value of at least 32 characters. Save it in a password manager. Restart/redeploy the backend if needed. Verify new passcode works at /admin and every historical passcode is rejected. Never put it in frontend EXPO_PUBLIC variables.
3. Ask Emergent support to **revoke all historical Emergent-Commit-Key values** found in public Git commit metadata, and clarify whether they are active credentials or commit identifiers. Do not paste the values into support tickets unless via their secure credential channel.
4. Check Emergent project sharing, collaborators, logs, deployment access, and billing access. Enable MFA where available.

## Integration rotation (one at a time)
| Backend variable | Current integration | Safe rotation |
| --- | --- | --- |
| EMERGENT_EMAIL_KEY | Emergent-managed email relay | Generate replacement through Emergent, set backend secret, restart, send a test email, then revoke old key |
| EMERGENT_PUSH_KEY | Emergent-managed push relay | Generate replacement, set backend secret, restart, test device registration and push, then revoke old key |
| EMERGENT_LLM_KEY | Emergent-managed photo storage | Coordinate with Emergent; confirm new key can access existing objects, test upload and private read before revoking |
| MONGO_URL | MongoDB connection string | Identify DB owner; create separate least-privilege database user with a new password, switch backend secret, verify reads/writes, then revoke old DB user |
| ADMIN_PASSCODE | Admin access and signed admin photo tokens | Replace immediately; verify old credentials and old admin photo tokens no longer work |

Do not rotate identifiers such as APPLE_AUDIENCES or EXPO_PUBLIC_BACKEND_URL as though they were secrets. Google sign-in depends on Emergent's OAuth session exchange and needs migration, not simple key rotation.

## Test checklist after each deployment
- Backend starts, MongoDB reads and writes work.
- New admin passcode works; old passcodes fail.
- Order creation works in demo mode (do not mistake it for a real payment).
- Confirmation email sends and delivers to a real inbox.
- Push registration and test notification succeed on a real device.
- Photo upload, private photo retrieval, and approved-review photo access succeed.
- Google and Apple sign-in work.
- Existing customers' data and stored photos remain accessible.

## Additional launch blockers
- Orders default to `mock_paid`; no real payment capture. Do not publicly launch checkout as paid.
- `GET /api/orders/{order_id}` exposes order/customer data to anyone with the order ID; require customer authorization or a scoped receipt token before launch.
- The order reminder endpoints also use only order ID; require authorization before launch.
- Restrict CORS to known web origins and retest mobile/web flows.
- Confirm domain email MX configuration for @smoothscar.com.

## Migration destination
Move to owner-controlled hosting, database, direct transactional email, push provider, object storage, and Google OAuth. Verify functionality before disabling Emergent. Retain backups and document rollback.

## Escalation to Emergent support
Request the exact steps for rotating Emergent-Commit-Key (if an active credential), EMERGENT_EMAIL_KEY, EMERGENT_PUSH_KEY, EMERGENT_LLM_KEY, and MongoDB credentials for the SmoothScar project without deleting existing photos, users, or orders. Request a secure handoff/export of the production MongoDB database and object storage, plus confirmation of where backend secrets are configured.
