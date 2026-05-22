/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");

const baseUrl = (process.env.ORDERKO_SMOKE_BASE_URL || process.env.ORDERKO_QR_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const restaurantSlug = process.env.ORDERKO_SMOKE_RESTAURANT_SLUG || "g-cafe";
const attempts = Number(process.env.ORDERKO_SMOKE_ATTEMPTS || "6");
const delayMs = Number(process.env.ORDERKO_SMOKE_DELAY_MS || "10000");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await request(path);
    last = result;
    if (result.response.status >= 200 && result.response.status < 300) return result.body;
    console.error(`${path} attempt ${attempt}/${attempts} returned ${result.response.status}: ${String(result.body).slice(0, 180)}`);
    if (attempt < attempts) await sleep(delayMs);
  }
  assert.fail(`${path} did not become healthy after ${attempts} attempts. Last status ${last.response.status}: ${String(last.body).slice(0, 180)}`);
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
