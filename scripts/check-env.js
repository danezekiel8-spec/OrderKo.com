/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const production = process.argv.includes("--production") || process.env.NODE_ENV === "production";
const errors = [];
const warnings = [];

function loadDotEnv() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function value(name) {
  return process.env[name]?.trim() ?? "";
}

function requireValue(name) {
  if (!value(name)) errors.push(`${name} is required.`);
}

function isLocalUrl(input) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.0\.|172\.(1[6-9]|2\d|3[01])\./i.test(input);
}

function hasWeakPin(pin) {
  return pin.length < 4 || /^(\d)\1+$/.test(pin) || ["1111", "2222", "9999", "1234", "0000"].includes(pin);
}

loadDotEnv();

[
  "DATABASE_URL",
  "STAFF_SESSION_SECRET",
  "ADMIN_PIN",
  "CASHIER_PIN",
  "KITCHEN_PIN",
  "ORDERKO_QR_BASE_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
].forEach(requireValue);

const databaseUrl = value("DATABASE_URL");
if (production && !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  errors.push("DATABASE_URL must be a PostgreSQL connection string in production.");
}

const secret = value("STAFF_SESSION_SECRET");
if (production && (secret.length < 32 || ["development-only-secret", "replace-this-before-production"].includes(secret))) {
  errors.push("STAFF_SESSION_SECRET must be a non-placeholder value with at least 32 characters.");
}

for (const name of ["ADMIN_PIN", "CASHIER_PIN", "KITCHEN_PIN"]) {
  const pin = value(name);
  if (production && hasWeakPin(pin)) {
    errors.push(`${name} must be changed from demo/weak values before production.`);
  } else if (!production && hasWeakPin(pin)) {
    warnings.push(`${name} is using a demo-style value. Replace it before deploying.`);
  }
}

const qrBaseUrl = value("ORDERKO_QR_BASE_URL");
if (production && (!qrBaseUrl.startsWith("https://") || isLocalUrl(qrBaseUrl))) {
  errors.push("ORDERKO_QR_BASE_URL must be the final HTTPS production domain.");
} else if (!production && isLocalUrl(qrBaseUrl)) {
  warnings.push("ORDERKO_QR_BASE_URL is local/LAN only. Regenerate QR codes after setting the production domain.");
}

const cloudinaryValues = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].map(value);
if (cloudinaryValues.some(Boolean) && cloudinaryValues.some((entry) => !entry)) {
  errors.push("Cloudinary environment variables must be configured together.");
}

for (const warning of warnings) console.warn(`Warning: ${warning}`);

if (errors.length) {
  console.error("Environment check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(production ? "Production environment check passed." : "Environment check passed.");
