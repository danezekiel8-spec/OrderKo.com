# AWS Migration Runbook

Use this to move OrderKo from Render to AWS without interrupting live restaurant usage.

## Recommended AWS Shape

- App hosting: AWS App Runner using `apprunner.yaml`
- Database: Amazon RDS PostgreSQL
- Images: keep Cloudinary for now
- Email: keep Gmail SMTP for now
- Region: use the closest practical region, likely Singapore for PH/NZ pilot usage

App Runner is the safer first AWS target because OrderKo runs as a normal Node/Next.js server. Do not switch the live domain until the AWS URL passes the full order flow.

## Phase 1: Billing Guardrail

Before creating resources:

- Create an AWS Budget.
- Add email alerts at 50%, 80%, and 100% of your monthly budget or credits.
- Confirm your 6-month AWS offer/credits in Billing.

## Phase 2: RDS PostgreSQL

Create one PostgreSQL RDS database:

- Database name: `orderko`
- Engine: PostgreSQL
- Instance: smallest pilot-safe size covered by your AWS offer
- Storage: start small, enable autoscaling only if you understand the cost
- Backups: enable automated backups
- Public access: prefer private access through an App Runner VPC connector

Save the connection string for `DATABASE_URL`.

## Phase 3: App Runner

Create an App Runner service from the GitHub repository:

- Branch: `main`
- Configuration source: repository file
- Config file: `apprunner.yaml`
- Health check path: `/api/health`

Set these runtime environment variables:

- `DATABASE_URL`
- `STAFF_SESSION_SECRET`
- `STAFF_PIN_SECRET`
- `ORDERKO_SUPER_ADMIN_SECRET`
- `ORDERKO_DEFAULT_RESTAURANT_SLUG`
- `ORDERKO_QR_BASE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `LEAD_NOTIFICATION_EMAIL`
- `LEAD_EMAIL_FROM`

For private RDS, configure App Runner VPC access so the app can reach the database.

## Phase 4: Private AWS Test

Use the temporary App Runner URL first.

Test:

- `/api/health`
- `/`
- `/super-admin`
- create a test restaurant
- add menu/category/item/image
- `/r/[slug]`
- `/k/[slug]`
- place order
- staff login
- cashier mark paid
- kitchen mark ready
- customer status updates
- demo request email saves and sends

## Phase 5: Data Migration

If keeping Render data:

1. Pick a quiet/closed-hours window.
2. Close ordering in Admin or pause service in Super Admin.
3. Export Render Postgres.
4. Import into RDS.
5. Run `npm run db:deploy:postgres` against RDS.
6. Test AWS with imported data.

Important: only one database should accept real orders during migration.

## Phase 6: Domain Cutover

Only after AWS passes:

1. Lower DNS TTL to around 300 seconds before cutover.
2. Set AWS `ORDERKO_QR_BASE_URL` to the final domain.
3. Point DNS to AWS/App Runner.
4. Test live domain:
   - `/api/health`
   - `/r/[slug]`
   - `/k/[slug]`
   - `/staff/login`
   - `/admin`
   - `/super-admin`
5. Keep Render live for rollback.

## Rollback

If AWS fails:

1. Point DNS back to Render.
2. Keep restaurant on paper ordering during the change if needed.
3. Confirm Render `/api/health`.
4. Place one test order.
5. Resume normal service.

## Do Not Do

- Do not delete Render immediately.
- Do not cut over during rush hours.
- Do not let Render and AWS both accept real orders against different databases.
- Do not move images from Cloudinary during this migration.
