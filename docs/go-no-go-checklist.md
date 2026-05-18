# Go / No-Go Checklist

Use this before opening a restaurant for live customer ordering.

## Go

Launch the pilot only if all of these are true:

- `/api/health` returns healthy on production.
- Production database is Render Postgres or another persistent Postgres database.
- Latest production deploy is green.
- Super Admin can open the restaurant record.
- Restaurant service is active.
- Restaurant ordering is open.
- Staff PINs are configured for admin, cashier, and kitchen.
- QR opens the correct `/r/[slug]` URL on iPhone and Android.
- A test customer order creates a visible order number.
- Cashier can mark the order paid.
- Kitchen receives the paid order.
- Kitchen can mark the order ready.
- Customer status page shows Ready for Pickup.
- Staff know the fallback paper-order process.

## No-Go

Do not launch if any of these are true:

- Production database is missing or using temporary storage.
- QR opens localhost, a LAN IP, or the wrong restaurant.
- Staff login fails.
- Orders do not persist after refresh.
- Cashier cannot mark paid.
- Kitchen cannot see paid orders.
- Customer status page cannot load.
- Staff have not been briefed on fallback.

## If Unsure

Run one more full customer -> cashier -> kitchen -> customer test order before opening ordering.
