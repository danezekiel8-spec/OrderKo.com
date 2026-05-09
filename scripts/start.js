/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync } = require("node:child_process");

function run(command, args) {
  execFileSync(command, args, {
    stdio: "inherit",
  });
}

const databaseUrl = process.env.DATABASE_URL || "";
const isProductionPostgres =
  process.env.NODE_ENV === "production" && /^postgres(ql)?:\/\//i.test(databaseUrl);

if (isProductionPostgres) {
  run("npx", ["prisma", "generate", "--schema", "prisma/postgres/schema.prisma"]);
  run("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/postgres/schema.prisma"]);
  run("node", ["scripts/bootstrap-g-cafe.js"]);
}

run("npx", ["next", "start"]);
