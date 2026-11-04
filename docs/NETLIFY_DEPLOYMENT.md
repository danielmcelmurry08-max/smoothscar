# SmoothScar frontend deployment to Netlify

**Prepared only; not deployed or build-verified.** This is a web frontend build, not a replacement for the Python FastAPI backend.

## Connect
1. Log in to Netlify and select **Add new project > Import an existing project > GitHub**.
2. Authorize the GitHub repository `danielmcelmurry08-max/smoothscar`.
3. Select branch `autonomous/migration-readiness` for a preview. Do not deploy this branch as a live customer storefront.
4. Netlify should detect the root `netlify.toml`. Base directory: `frontend`. Build command: `yarn install --frozen-lockfile && npx expo export --platform web`. Publish directory: `dist` (relative to base).
5. In Netlify's environment variables, set `EXPO_PUBLIC_BACKEND_URL` to the HTTPS URL of a **working independent backend**. This is embedded in the web bundle and is not a secret.
6. Deploy, review the build log, test direct page refresh/deep links, and check browser network requests.

## Known blockers
- No independent FastAPI backend or MongoDB connection has been provisioned. The website may render but API-backed pages will fail.
- Existing backend uses Emergent-managed Google login, email, push, and photo storage. Those integrations must be migrated.
- Checkout records `mock_paid` and must not be used for real payments.
- Customer order and reminder authorization issues need fixes before launch.
- This branch's web export has **not** been executed in this workflow. Dependency or web-compatibility errors may require follow-up changes.
- Keep production domain detached until payment, security, auth, and backend are tested.

## If the build fails
Check the Netlify deploy log. If Netlify reports `yarn` missing or incompatible Node, select Node 22 and Yarn classic. If Metro reports a package not compatible with web, fix the package import or add a web-safe implementation. Avoid putting private API keys in Expo public environment variables.
