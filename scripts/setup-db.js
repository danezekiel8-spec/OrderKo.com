/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync } = require("node:child_process");
const { existsSync, readFileSync, rmSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dbPath = path.join(root, "prisma", "dev.db");
const migrationPath = path.join(root, "prisma", "migrations", "20260508110500_init", "migration.sql");
const shouldReset = process.argv.includes("--reset");
const shouldSeed = !process.argv.includes("--no-seed");

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return "";
  const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.*)$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    ...options,
  });
}

function runSql(sql) {
  execFileSync("sqlite3", [dbPath, sql], {
    cwd: root,
    stdio: "pipe",
  });
}

const databaseUrl = readDatabaseUrl();
if (process.env.NODE_ENV === "production") {
  throw new Error("setup-db.js is a local SQLite helper and must not run in production.");
}
if (databaseUrl && !databaseUrl.startsWith("file:")) {
  throw new Error("setup-db.js only supports local SQLite DATABASE_URL values.");
}

if (shouldReset && existsSync(dbPath)) {
  if (process.env.ORDERKO_ALLOW_DB_RESET !== "local-dev-only") {
    throw new Error("Refusing to reset the local database without ORDERKO_ALLOW_DB_RESET=local-dev-only.");
  }
  rmSync(dbPath);
}

if (!existsSync(dbPath)) {
  run("sqlite3", [dbPath, `.read ${migrationPath}`]);
}

try {
  runSql('ALTER TABLE "Order" ADD COLUMN "customerAccessToken" TEXT;');
} catch {
  // Column already exists in an up-to-date local database.
}
runSql('CREATE UNIQUE INDEX IF NOT EXISTS "Order_customerAccessToken_key" ON "Order"("customerAccessToken");');

run("npx", ["prisma", "generate"]);

if (shouldSeed) {
  run("node", ["prisma/seed.js"]);
}
