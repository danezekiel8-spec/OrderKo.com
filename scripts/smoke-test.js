/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const baseUrl = process.env.ORDERKO_BASE_URL || "http://localhost:3000";

if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)) {
  throw new Error("scripts/smoke-test.js mutates data and is only allowed against localhost. Use npm run test:prod-smoke for deployed read-only checks.");
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

async function login(role, pin) {
  const { response, body } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ role, pin }),
  });
  assert.equal(response.status, 200, `Login failed for ${role}: ${JSON.stringify(body)}`);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, `Missing session cookie for ${role}`);
  return cookie.split(";")[0];
}

async function patchOrder(cookie, orderId, payload, expectedStatus = 200) {
  const { response, body } = await request(`/api/staff/orders/${orderId}`, {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, expectedStatus, `Unexpected order patch response: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      menuItems: {
        where: { isActive: true, isSoldOut: false },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  assert.ok(restaurant, "Seeded restaurant missing.");
  assert.equal(restaurant.slug, "g-cafe");

  const menuItem = restaurant.menuItems.find((item) => item.optionGroupsJson.includes("Sugar")) ?? restaurant.menuItems[0];
  assert.ok(menuItem, "Seeded menu item missing.");

  const { response: orderResponse, body: orderBody } = await request(`/api/restaurants/${restaurant.slug}/orders`, {
    method: "POST",
    body: JSON.stringify({
      submissionKey: `smoke-${Date.now()}`,
      customerName: "Smoke Test",
      customerNote: "Automated lifecycle smoke test",
      items: [
        {
          menuItemId: menuItem.id,
          quantity: 1,
          note: "No straw",
          selectedOptions: menuItem.optionGroupsJson.includes("Sugar")
            ? [{ groupName: "Sugar", optionName: "50%", priceCents: 0 }]
            : [],
        },
      ],
    }),
  });
  assert.equal(orderResponse.status, 201, `Order creation failed: ${JSON.stringify(orderBody)}`);
  const order = await prisma.order.findUnique({ where: { id: orderBody.order.id } });
  assert.ok(order, "Created order missing.");
  assert.equal(order.status, "AWAITING_PAYMENT");

  const cashierCookie = await login("cashier", "1111");
  await patchOrder(cashierCookie, order.id, { action: "markPaid" });
  const paid = await prisma.order.findUnique({ where: { id: order.id } });
  assert.equal(paid.status, "PAYMENT_CONFIRMED");
  assert.equal(paid.paymentStatus, "PAID");

  const kitchenCookie = await login("kitchen", "2222");
  await patchOrder(kitchenCookie, order.id, { action: "setStatus", status: "READY_FOR_PICKUP" }, 409);
  await patchOrder(kitchenCookie, order.id, { action: "setStatus", status: "PREPARING" });
  await patchOrder(kitchenCookie, order.id, { action: "setStatus", status: "ALMOST_READY" });
  await patchOrder(kitchenCookie, order.id, { action: "setStatus", status: "READY_FOR_PICKUP" });
  await patchOrder(kitchenCookie, order.id, { action: "setStatus", status: "COMPLETED" });

  const completed = await prisma.order.findUnique({ where: { id: order.id } });
  assert.equal(completed.status, "COMPLETED");

  const adminCookie = await login("admin", "9999");
  const { response: settingsResponse, body: settingsBody } = await request("/api/admin/restaurant", {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      slug: restaurant.slug,
      currency: restaurant.currency,
      isOpen: restaurant.isOpen,
    }),
  });
  assert.equal(settingsResponse.status, 200, `Settings update failed: ${JSON.stringify(settingsBody)}`);

  const { response: soldOutResponse, body: soldOutBody } = await request(`/api/admin/menu-items/${menuItem.id}`, {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({ isSoldOut: true }),
  });
  assert.equal(soldOutResponse.status, 200, `Sold-out toggle failed: ${JSON.stringify(soldOutBody)}`);
  const unavailable = await prisma.menuItem.findUnique({ where: { id: menuItem.id } });
  assert.equal(unavailable.isSoldOut, true);

  await request(`/api/admin/menu-items/${menuItem.id}`, {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: JSON.stringify({ isSoldOut: false }),
  });

  console.log("Smoke test passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
