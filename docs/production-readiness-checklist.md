# Production Readiness Checklist

## Before Pilot

- Render web service is deployed over HTTPS.
- Render Postgres is attached and `DATABASE_URL` is not SQLite.
- `npm run env:check:production` passes in the deployment environment.
- `npm run build` passes locally.
- `ORDERKO_QR_BASE_URL` uses the production HTTPS domain.
- Admin, cashier, and kitchen PINs are changed from demo values.
- Cloudinary credentials are configured and menu image upload works in admin.
- `/api/health` returns `{ "ok": true }`.
- `npm run db:bootstrap:g-cafe` has been run once against the production database.
- Read-only production smoke test passes.

## Security Gates

- Customer order status URLs include the private `t` access token.
- Staff routes redirect unauthenticated users to `/staff/login`.
- Admin upload API requires admin session.
- `.env` is not committed.
- If Cloudinary secrets were shared or screenshotted, rotate them before launch.

## Operational Gates

- Printed QR opens `/r/g-cafe` on iPhone Safari and Android Chrome.
- Cashier can mark an unpaid order as paid.
- Kitchen only sees paid orders.
- Kitchen can move paid orders through Preparing, Almost Ready, Ready, and Completed.
- Customer status page updates after cashier/kitchen actions.
- Staff know the paper fallback if Wi-Fi or Render has an incident.

## Do Not Run In Production

- `npm run db:reset`
- `npm run db:seed`
- `npm run test:smoke`

Use `npm run test:prod-smoke` for production because it is read-only.
