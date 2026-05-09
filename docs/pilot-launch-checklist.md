# OrderKo Pilot Launch Checklist

## Launch Gates

### Ordering Gate
- Customer can place an order from `/r/g-cafe`.
- Duplicate taps do not create duplicate orders.
- Cart survives refresh before order placement.
- Cashier sees incoming unpaid orders.
- Cashier marks orders paid before kitchen work starts.
- Kitchen status updates appear on the customer status page.
- Refreshing the status page keeps the correct order state.

### Mobile Gate
- QR opens on iPhone Safari and Android Chrome.
- No horizontal scrolling on narrow screens.
- Menu cards, item modal, cart drawer, and status page are easy to tap one-handed.
- Keyboard does not hide required cart actions.
- Uploaded Cloudinary images render on the customer menu.
- Order number is readable enough to show cashier.

### Production Gate
- Production database is managed and persistent; do not use local SQLite for pilot.
- `STAFF_SESSION_SECRET`, `ADMIN_PIN`, `CASHIER_PIN`, and `KITCHEN_PIN` are changed from demo values.
- Cloudinary env vars are configured and upload tested.
- QR base URL uses the final HTTPS domain.
- `npm run build` and production start pass against production-like env.
- Admin/staff routes are protected; customer menu and order status remain public.
- A rollback/disable-ordering plan is documented.

## Launch-Day SOP

- Keep one staff member watching cashier orders during the first rush period.
- Keep a paper order pad ready if Wi-Fi or the app fails.
- If Wi-Fi drops, staff continue with visible orders and pause new customer ordering at the counter.
- If kitchen dashboard disconnects, cashier reads paid orders to kitchen manually until reconnect.
- Owner/admin can pause ordering by turning off "Accept customer orders" in admin.
- Owner/admin can mark items sold out from admin during rush.
- Check deployment logs for failed order creation, staff action failures, upload failures, and database errors.
- Do not reset or delete production data without a manual backup first.

## Production Data Rules

- Customer name and notes are optional; do not request phone/email for the pilot.
- Staff should avoid putting private customer information in notes.
- Export/back up production orders before any migration or reset.
- Keep completed/canceled orders until the owner confirms retention policy.
