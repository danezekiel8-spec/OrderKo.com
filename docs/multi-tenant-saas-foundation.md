# OrderKo Multi-Tenant SaaS Foundation

OrderKo now uses restaurant-scoped staff sessions for protected staff and admin work.

## Tenant Model

- Public customer menu: `/r/[restaurantSlug]`
- Public kiosk menu: `/k/[restaurantSlug]`
- Staff login includes restaurant slug, role, and PIN.
- Staff sessions store `role`, `restaurantId`, `restaurantSlug`, and `restaurantName`.
- Admin, cashier, and kitchen APIs derive `restaurantId` from the signed session.
- Client-submitted restaurant IDs are not trusted for protected operations.

## Staff Credentials

Staff PINs are stored per restaurant in `StaffCredential`.

- `cashier`
- `kitchen`
- `admin`

PINs are stored as HMAC hashes using `STAFF_PIN_SECRET`. If `STAFF_PIN_SECRET` is not set in local development, the app falls back to `STAFF_SESSION_SECRET`.

Production should set:

- `STAFF_SESSION_SECRET`
- `STAFF_PIN_SECRET`
- `ORDERKO_DEFAULT_RESTAURANT_SLUG`
- `ORDERKO_SUPER_ADMIN_SECRET`

Restaurant-specific PINs are created and reset from Super Admin or the restaurant admin dashboard. Production startup should not depend on seed scripts for live tenant access.

## Data Isolation Rules

Protected routes must follow these rules:

- Admin restaurant settings update only the session restaurant.
- Admin category create/edit/delete only affects the session restaurant.
- Admin menu item create/edit/delete only affects the session restaurant.
- Staff order list only returns orders for the session restaurant.
- Staff order actions only update orders for the session restaurant.
- Uploads are placed under a restaurant-specific Cloudinary folder.

## Order Number Safety

Orders now have a unique `(restaurantId, orderNumber)` constraint.

Order creation still allocates the next visible queue number by restaurant, but the unique constraint protects against duplicate numbers during concurrent submissions. The order API retries on unique constraint collisions.

## Local Verification Performed

- Applied local Prisma migration.
- Bootstrapped G-Cafe staff credentials without deleting orders.
- Verified G-Cafe cashier and kitchen login through HTTP.
- Placed a customer order through the public restaurant order API.
- Confirmed unpaid order appears in cashier but not kitchen.
- Marked order paid and confirmed it appears in kitchen.
- Progressed kitchen status through completed.
- Created a temporary second tenant and confirmed its cashier saw no G-Cafe orders.
- Submitted six concurrent customer orders and confirmed unique order numbers.

## Remaining SaaS Work

- Add owner email/password or magic-link login before broad public signup.
- Add billing/plan state later; do not add payments before pilot validation.
- Run the same isolation tests on production after Render migration deploy.
