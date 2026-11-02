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
