# OrderKo

OrderKo is a lightweight QR and kiosk ordering system for small restaurants, cafes, takeaway shops, milk tea stores, and food stalls.

## Core Routes

- Landing page: `/`
- Customer menu: `/r/[slug]`
- Kiosk ordering: `/k/[slug]`
- Staff login: `/staff/login`
- Cashier: `/staff/cashier`
- Kitchen: `/staff/kitchen`
- Restaurant admin: `/admin`
- Super Admin: `/super-admin`

## Local Development

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Production Checks

```bash
npm run env:check:production
npm run lint
npm run typecheck
npm run build
```

Render uses:

```bash
npm run build:render
npm run start:render
```

AWS App Runner uses:

```bash
npm run build:aws
npm run start:aws
```

Production startup deploys Prisma migrations. Restaurants should be created and managed from `/super-admin`; do not rely on seed scripts for live tenant setup.

## Launch Docs

- `docs/aws-migration-runbook.md`
- `docs/pilot-launch-checklist.md`
- `docs/production-readiness-checklist.md`
- `docs/render-deployment-runbook.md`
- `docs/first-restaurant-onboarding-template.md`
- `docs/staff-pilot-sop.md`
- `docs/go-no-go-checklist.md`
- `docs/launch-issue-log.md`
