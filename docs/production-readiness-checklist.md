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

## Render Gates

- Render web service deploy succeeds from the expected Git commit.
- Render service logs show successful Prisma migration deploy and Next.js startup.
- Render PostgreSQL is the only production `DATABASE_URL`.
- Render custom domain points to the active web service.
- Final domain passes the production smoke test after DNS changes.
- If `/api/health` returns JSON with `ok: false`, inspect Render database connection and env vars before changing DNS.
- If Render returns `502` or `503`, inspect deploy logs, service status, and database availability before customer testing.

## Security Gates

- Customer order status URLs include the private `t` access token.
- Staff routes redirect unauthenticated users to `/staff/login`.
- Admin upload API requires admin session.
- `.env` is not committed.
- If Cloudinary secrets were shared or screenshotted, rotate them before launch.
- Super Admin audit logs show privileged changes.
- Run `npm audit` before pilot launch and record accepted dependency risks.

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
