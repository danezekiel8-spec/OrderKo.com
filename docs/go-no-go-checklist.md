# Go / No-Go Checklist

Use this before opening a restaurant for live customer ordering.

## Go

Launch the pilot only if all of these are true:

- `/api/health` returns healthy on production.
- Production database is Render Postgres or another persistent Postgres database.
- Latest production deploy is green.
- Read-only production smoke passed for the actual pilot slug.
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
- If kiosk is enabled, one kiosk order reaches cashier and can be completed.
- Staff know the fallback paper-order process.
- A named manager owns the final go/no-go decision.

## No-Go

Do not launch if any of these are true:

- Any unresolved Blocker or High launch issue remains open.
- Production smoke fails.
- Full manual customer -> cashier -> kitchen -> customer canary order fails.
- Production database is missing or using temporary storage.
- QR opens localhost, a LAN IP, or the wrong restaurant.
- Staff login fails.
- Orders do not persist after refresh.
- Cashier cannot mark paid.
- Kitchen cannot see paid orders.
- Customer status page cannot load.
- Staff have not been briefed on fallback.
- Staff devices, payment terminal, printed QR, or fallback paper order pad are not ready.
- No named owner can pause ordering during an incident.

## If Unsure

Run one more full customer -> cashier -> kitchen -> customer test order before opening ordering.
