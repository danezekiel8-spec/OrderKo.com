# AWS Migration Runbook

Use this to move OrderKo from Render to AWS without interrupting live restaurant usage.

## Recommended AWS Shape

- App hosting: Amazon ECS Express Mode
- Container registry: Amazon ECR
- Database: Amazon RDS PostgreSQL
- Images: keep Cloudinary for now
- Email: keep Gmail SMTP for now
- Region: use the same region for ECS and RDS, preferably close to users

App Runner is no longer the right path for new AWS customers. ECS Express Mode requires a container image, then creates the managed ECS/Fargate service and public URL.

## Phase 1: Billing Guardrail

Before creating more resources:

- Create an AWS Budget.
- Add email alerts at 50%, 80%, and 100%.
- Confirm your credits/free offer in AWS Billing.
- Avoid NAT Gateway unless you explicitly accept the cost.

## Phase 2: RDS PostgreSQL

Create one PostgreSQL RDS database:

- Database name: `orderko`
- Engine: PostgreSQL
- Instance: smallest pilot-safe/free-tier-eligible option
- Backups: automated backups enabled
- Public access: preferably `No`
- Security group: allow PostgreSQL `5432` only from the ECS/app security group

Save the connection string for `DATABASE_URL`.

## Phase 3: ECR Repository

Create an ECR private repository:

- Repository name: `orderko-web`
- Image tag mutability: mutable is acceptable for pilot
- Scan on push: enabled if available

After creation, AWS will show push commands. They look like this:

```bash
aws ecr get-login-password --region YOUR_REGION \
  | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com

docker build -t orderko-web .
docker tag orderko-web:latest YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/orderko-web:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/orderko-web:latest
```

## Phase 4: ECS Express Mode

Create an ECS Express Mode service:

- Container image: ECR image URL ending in `orderko-web:latest`
- Container port: `3000`
- Desired tasks: `1` for pilot
- CPU/memory: smallest safe option
- Public HTTPS: enabled
- Health check path: `/api/health`
- VPC/network: same VPC as RDS
- Security group: allow outbound to RDS; RDS security group allows inbound from this app security group

Set these environment variables:

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

For first AWS testing, set `ORDERKO_QR_BASE_URL` to the temporary ECS public URL after AWS provides it.

## Phase 5: Private AWS Test

Use the temporary ECS URL first.

Test:

- `/api/health`
- `/`
- `/super-admin`
- create a test restaurant
- add category/menu item/image
- `/r/[slug]`
- `/k/[slug]`
- place order
- staff login
- cashier mark paid
- kitchen mark ready
- customer status updates
- demo request email saves and sends

## Phase 6: Data Migration

If keeping Render data:

1. Pick a quiet/closed-hours window.
2. Close ordering in Admin or pause service in Super Admin.
3. Export Render Postgres.
4. Import into RDS.
5. Run Prisma migrations against RDS.
6. Test ECS with imported data.

Important: only one database should accept real orders during migration.

## Phase 7: Domain Cutover

Only after ECS passes:

1. Lower DNS TTL to around 300 seconds before cutover.
2. Set AWS `ORDERKO_QR_BASE_URL` to the final domain.
3. Point DNS to the ECS/ALB endpoint.
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
