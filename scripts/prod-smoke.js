/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");

const baseUrl = (process.env.ORDERKO_SMOKE_BASE_URL || process.env.ORDERKO_QR_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const restaurantSlug = process.env.ORDERKO_SMOKE_RESTAURANT_SLUG || "g-cafe";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      Accept: "application/json,text/html,*/*",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function expectOk(path) {
  const { response, body } = await request(path);
  assert.ok(response.status >= 200 && response.status < 300, `${path} returned ${response.status}: ${String(body).slice(0, 180)}`);
  return body;
}

async function expectProtected(path) {
  const { response } = await request(path);
  assert.ok(
    response.status === 200 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308,
    `${path} returned unexpected status ${response.status}`,
  );
  const location = response.headers.get("location") || "";
  if (response.status >= 300) {
    assert.ok(location.includes("/staff/login"), `${path} should redirect to staff login, got ${location}`);
  }
}

async function main() {
  const health = await expectOk("/api/health");
  assert.equal(health.ok, true, "Health endpoint did not report ok=true.");

  await expectOk(`/r/${restaurantSlug}`);
  const menu = await expectOk(`/api/restaurants/${restaurantSlug}/menu`);
  assert.ok(menu.restaurant?.slug === restaurantSlug, "Restaurant menu payload did not match smoke slug.");
  assert.ok(Array.isArray(menu.categories), "Menu categories missing.");

  await expectOk("/manifest.webmanifest");
  await expectProtected("/admin");
  await expectProtected("/staff/cashier");
  await expectProtected("/staff/kitchen");

  console.log(`Read-only smoke test passed for ${baseUrl}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
