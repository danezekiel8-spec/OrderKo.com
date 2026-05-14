# OrderKo Pilot Launch Checklist

Use this before onboarding any real restaurant or running a live pilot shift.

## 1. Platform Access

- Production URL:
- Super Admin URL: `/super-admin`
- Staff login URL: `/staff/login`
- Support contact:
- Person monitoring launch:
- Launch date and time:

## 2. Environment Check

- `DATABASE_URL` is a persistent managed Postgres database.
- `STAFF_SESSION_SECRET` is set and production-safe.
- `ORDERKO_SUPER_ADMIN_SECRET` is set and production-safe.
- `ORDERKO_QR_BASE_URL` uses the final HTTPS production domain.
- Cloudinary variables are configured if image upload is enabled.
- Render deploy is green.
- `/api/health` returns healthy.

## 3. Restaurant Setup

- Restaurant created in Super Admin.
- Restaurant slug/username confirmed.
- Restaurant service is active.
- Kiosk is enabled or disabled intentionally.
- Internal restaurant notes are filled in.
- Staff PINs are set for admin, cashier, and kitchen.
- Restaurant starts closed until menu and test order are verified.

## 4. Menu Setup

- Categories are created and ordered.
- Menu items are added.
- Prices are checked.
- Sold-out toggles tested.
- Images uploaded or image URLs added.
- Add-ons/options checked where applicable.
- Customer menu opens at `/r/[slug]`.
- Kiosk opens at `/k/[slug]` if enabled.

## 5. QR Setup

- Customer QR points to `/r/[slug]` on the production domain.
- Kiosk URL is ready for staff/tablet if used.
- Printed QR scans on iPhone Safari.
- Printed QR scans on Android Chrome.
- QR signage is readable at counter distance.

## 6. Full Order Test

- Customer opens menu from QR.
- Customer adds at least two items.
- Customer edits quantity.
- Customer adds a note.
- Customer places order once.
- Customer receives order number.
- Cashier receives unpaid order.
- Cashier marks paid.
- Kitchen receives paid order.
- Kitchen marks preparing.
- Kitchen marks ready.
- Customer status page shows Ready for Pickup.
- Kitchen marks completed.

## 7. Staff Briefing

- Cashier knows how to log in.
- Cashier knows to mark paid only after payment is received.
- Kitchen knows only paid orders appear.
- Admin knows how to mark sold out.
- Staff know the support contact.
- Staff know the fallback process if Wi-Fi drops.

## 8. Fallback Process

- Paper order pad is ready.
- Staff know who decides when to pause ordering.
- If ordering must stop, close restaurant ordering in Admin or pause service in Super Admin.
- If kiosk must stop, turn kiosk off in Super Admin.
- If Wi-Fi drops, continue visible active orders and switch to paper ordering.
- After reconnect, reconcile paper orders with dashboard orders.

## 9. Launch Monitoring

- Monitor Render logs during first rush period.
- Watch cashier and kitchen screens for delays.
- Record customer/staff confusion.
- Record wrong-order or duplicate-order incidents.
- Avoid adding new features during live service unless blocking.

## 10. After Pilot Shift

- Count total orders.
- Count completed orders.
- Record canceled/problem orders.
- Ask cashier what slowed them down.
- Ask kitchen what was unclear.
- Update restaurant notes in Super Admin.
- Decide whether to launch, pause, or refine before next shift.
