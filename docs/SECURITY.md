# Security checklist

## Immediate actions

1. Rotate the admin passcode. The historical product requirements document contained a literal admin credential. It has been removed from the current documentation, but this does not erase it from Git history.
2. Rotate every real API key, database password, OAuth secret, signing key or other credential that may have appeared in any commit, issue, log, screenshot or shared workspace.
3. Enable GitHub secret scanning and push protection where available. Run a full-history scanner (for example, Gitleaks) locally or in CI. Do not paste detected secret values into issues or chat.
4. Keep the repository private while investigating historical credentials. If you keep it public, assume all prior committed secrets were exposed.
5. Review repository collaborators, GitHub Actions permissions, deployment secrets and any connected hosting accounts.

## Repository rules

- Never commit `.env`, `.env.*` files containing real values, private keys, database dumps, customer exports or access tokens.
- Keep secrets only in the deployment platform's encrypted secret manager.
- Frontend `EXPO_PUBLIC_*` variables are public by design.
- Use separate credentials and databases for development, staging and production.
- Use least-privilege database users and restrict database network access.
- Do not use real customer records in development or test environments.
- Do not log passwords, tokens, payment details or sensitive customer information.

## Important limitation

Deleting a secret from the latest version of a file does not remove it from earlier Git commits. Rotate first. Rewrite Git history only after making a secure backup and coordinating with every collaborator who may have cloned the repository.


## Additional source-review findings

These are code-review findings, not proof of an exploit in a deployed environment:

- `GET /api/orders/{order_id}` looks up an order by MongoDB ObjectId and returns the public order model. The model clears the photo token, but still includes the customer object and order details. Before launch, replace this with an authenticated customer route or a high-entropy, scoped, expiring receipt token, and return only the minimum fields needed by the receipt screen.
- CORS is configured with `allow_origins=["*"]` and `allow_credentials=True`. Restrict origins to the actual production website and approved development origins. Re-test authentication and admin flows after changing it.
- Admin access is a shared passcode sent in a request header. Rotate it, keep it server-side, and consider replacing it with named admin accounts, MFA and audit logging before production.


## Confirmed historical exposure from Git review

A targeted review of reachable commit metadata and diffs found:

- An `Emergent-Commit-Key` value embedded in multiple historical commit messages. Treat this as a compromised Emergent credential and revoke/replace it in the Emergent account or support channel. Removing it from a file will not remove it from commit metadata.
- Admin passcodes were included in historical commit messages and implementation/test context. Treat every historical admin passcode as compromised. Set a new high-entropy `ADMIN_PASSCODE` in the live backend secret manager and verify that the old values are rejected.
- The code currently consumes `EMERGENT_EMAIL_KEY`, `EMERGENT_PUSH_KEY`, and `EMERGENT_LLM_KEY` for Emergent-managed email, push, and photo storage respectively. Rotate/reissue these in the provider account if the values were ever shared or committed; the repository review did not expose their current values.
- `MONGO_URL` contains the MongoDB connection credential when using authenticated MongoDB. Rotate the database user's password if its URI was ever committed or shared; update the deployment secret and test connectivity before revoking the old password.
- Google sign-in currently exchanges sessions through an Emergent endpoint. This is a platform dependency, not an API key to rotate. Replace the exchange with direct Google OAuth or a standalone identity provider as part of migration.

## Rotation order and verification

1. Generate new credentials at each provider. Do not paste secrets into GitHub, pull requests, or chat.
2. Update the production backend's encrypted environment/secrets store. Keep the new and old credentials valid during the brief cutover where the provider supports overlapping keys.
3. Deploy and verify database connectivity, admin login (new passcode works; old passcode fails), transactional email, push registration/trigger, and photo upload/read.
4. Revoke the old credentials at the provider only after successful verification. If a credential is known to be exposed, minimize the overlap window.
5. Rewrite Git history only after a backup and coordination with collaborators. History rewriting does not replace rotation.

**Rotation status:** no provider credential has been rotated by this repository change. The GitHub connector can edit repository content, but it does not have access to the Emergent, MongoDB, email, push, hosting, or OAuth secret stores. The app's production deployment target has not yet been identified or accessed.
