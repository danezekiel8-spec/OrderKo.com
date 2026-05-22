# Production Readiness Checklist

## Before Pilot

- Production web service is deployed over HTTPS.
- Production Postgres is attached and `DATABASE_URL` is not SQLite.
- `npm run env:check:production` passes in the deployment environment.
- `npm run build` passes locally.
- `ORDERKO_QR_BASE_URL` uses the production HTTPS domain.
- `ORDERKO_SUPER_ADMIN_SECRET`, `STAFF_SESSION_SECRET`, and `STAFF_PIN_SECRET` are production-safe.
- Staff PINs are configured per restaurant in Super Admin.
- Cloudinary credentials are configured and menu image upload works in admin.
- `/api/health` returns `{ "ok": true }`.
- Read-only production smoke test passes with the pilot slug:

```bash
ORDERKO_SMOKE_BASE_URL=https://orderko.org ORDERKO_SMOKE_RESTAURANT_SLUG=<pilot-slug> npm run test:prod-smoke
```

## AWS ECS Gates

- ECR image is pushed with both `latest` and the Git SHA tag; record the image digest used for launch.
- ECS service desired count equals running count.
- Target group has at least one healthy target on container port `3000`.
- Temporary ECS URL passes the production smoke test.
- Final domain passes the same smoke test after DNS cutover.
- If `/api/health` returns JSON with `ok: false`, inspect the database fields before changing DNS.
- If the load balancer returns plain `503`, inspect target health and ECS stopped task reasons before changing DNS.

## Security Gates

- Customer order status URLs include the private `t` access token.
- Staff routes redirect unauthenticated users to `/staff/login`.
- Admin upload API requires admin session.
- `.env` is not committed.
- If Cloudinary secrets were shared or screenshotted, rotate them before launch.

## Operational Gates

- Printed QR opens `/r/[slug]` on iPhone Safari and Android Chrome.
- Cashier can mark an unpaid order as paid.
- Kitchen only sees paid orders.
- Kitchen can move paid orders through Preparing, Almost Ready, Ready, and Completed.
- Customer status page updates after cashier/kitchen actions.
- If kiosk is enabled, `/k/[slug]` loads and one kiosk canary order reaches cashier.
- Staff know the paper fallback if Wi-Fi or Render has an incident.

## Local Smoke Prerequisites

`npm run test:smoke` mutates local data. Run it only against a disposable local database with the seeded tenant and known local PINs. If it fails mid-run, check sold-out state and order status before reusing the local database.

## Do Not Run In Production

- `npm run db:reset`
- `npm run db:seed`
- `npm run test:smoke`
- `npm run db:bootstrap:g-cafe` unless you intentionally want to recreate the sample tenant in a non-production environment.

Use `npm run test:prod-smoke` for production because it is read-only.
