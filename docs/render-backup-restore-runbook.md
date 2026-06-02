# Render Backup and Restore Runbook

OrderKo production currently uses Render for the web service and managed PostgreSQL. Render PostgreSQL is the source of truth for restaurants, menus, staff credentials, orders, leads, and audit logs.

## Where to Check

- Render Dashboard -> PostgreSQL service `orderko-postgres`.
- Render Dashboard -> Web service logs for deploy and runtime errors.
- OrderKo Super Admin -> Operations monitor and recent audit logs.
- Public health check: `https://www.orderko.org/api/health`.

## Backup Discipline

- Keep Render managed database backups enabled for the production database.
- Before launch-day changes, confirm the latest backup exists in Render.
- Before risky data work, export a manual backup if Render plan supports it.
- Do not treat local SQLite or a developer machine as production backup.

## Safe Restore Process

1. Confirm the incident and pause restaurant ordering if needed.
2. Identify the last known good backup timestamp.
3. Notify affected restaurant operators before restoring data.
4. Restore to a separate database first when possible.
5. Verify `/api/health`, Super Admin, customer menu, cashier, and kitchen flows.
6. Point production `DATABASE_URL` to the restored database only after validation.
7. Record the incident and restore decision in internal notes.

## Do Not Run In Production

- `npm run db:reset`
- `npm run db:seed`
- `npm run test:smoke`
- Manual deletes without checking order history and audit logs.

## Emergency Fallback

If Render, database, or restaurant Wi-Fi is unavailable:

- Staff should switch to paper orders immediately.
- Cashier writes customer name/order number manually.
- Kitchen prepares from the paper queue.
- When service returns, staff may recreate only necessary active orders if operationally useful.

## Ownership

Recovery decisions should be made by the OrderKo operator and the restaurant manager together. The priority is keeping the restaurant operating, not preserving a perfect software workflow during an outage.
