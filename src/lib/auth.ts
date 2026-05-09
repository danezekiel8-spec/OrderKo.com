import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export type StaffRole = "cashier" | "kitchen" | "admin";

export const staffCookieName = "orderko_staff_session";

function envOrDevDefault(name: string, fallback: string) {
  const value = process.env[name]?.trim().replace(/^['"]|['"]$/g, "");
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production.`);
  }
  return fallback;
}

const rolePins: Record<StaffRole, string> = {
  cashier: envOrDevDefault("CASHIER_PIN", "1111"),
  kitchen: envOrDevDefault("KITCHEN_PIN", "2222"),
  admin: envOrDevDefault("ADMIN_PIN", "9999"),
};

function secret() {
  return envOrDevDefault("STAFF_SESSION_SECRET", "development-only-secret");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createStaffSession(role: StaffRole) {
  const payload = Buffer.from(
    JSON.stringify({ role, issuedAt: Date.now() }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffSessionToken(token?: string | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      role?: StaffRole;
      issuedAt?: number;
    };
    if (!decoded.role || !["cashier", "kitchen", "admin"].includes(decoded.role)) {
      return null;
    }
    return decoded.role;
  } catch {
    return null;
  }
}

export function isPinValid(role: StaffRole, pin: string) {
  return rolePins[role] === pin.trim();
}

export async function getStaffRole() {
  const cookieStore = await cookies();
  return verifyStaffSessionToken(cookieStore.get(staffCookieName)?.value);
}

export async function requireRole(allowed: StaffRole[]) {
  const role = await getStaffRole();
  if (!role || !allowed.includes(role)) {
    redirect(`/staff/login?next=${encodeURIComponent(defaultPathFor(allowed[0]))}`);
  }
  return role;
}

export function requireRequestRole(request: NextRequest, allowed: StaffRole[]) {
  const role = verifyStaffSessionToken(request.cookies.get(staffCookieName)?.value);
  if (!role || !allowed.includes(role)) {
    return null;
  }
  return role;
}

function defaultPathFor(role: StaffRole) {
  if (role === "admin") return "/admin";
  return `/staff/${role}`;
}
