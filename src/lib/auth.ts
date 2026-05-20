import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export type StaffRole = "cashier" | "kitchen" | "admin";
export type StaffSession = {
  role: StaffRole;
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  issuedAt: number;
};

export const staffCookieName = "orderko_staff_session";
const staffRoles = ["cashier", "kitchen", "admin"] as const;

function envOrDevDefault(name: string, fallback: string) {
  const rawValue = process.env[name]?.trim().replace(/^['"]|['"]$/g, "");
  const value = rawValue?.startsWith(`${name}=`)
    ? rawValue.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "")
    : rawValue;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production.`);
  }
  return fallback;
}

function secret() {
  return envOrDevDefault("STAFF_SESSION_SECRET", "development-only-secret");
}

function rolePin(role: StaffRole) {
  const envName = `${role.toUpperCase()}_PIN`;
  const fallback = role === "cashier" ? "1111" : role === "kitchen" ? "2222" : "9999";
  return envOrDevDefault(envName, fallback);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function pinSecret() {
  return process.env.STAFF_PIN_SECRET?.trim() || secret();
}

export function hashStaffPin(restaurantId: string, role: StaffRole, pin: string) {
  return createHmac("sha256", pinSecret())
    .update(`${restaurantId}:${role}:${pin.trim()}`)
    .digest("base64url");
}

function normalizeSlug(value?: string | null) {
  return value?.trim().toLowerCase() || process.env.ORDERKO_DEFAULT_RESTAURANT_SLUG?.trim().toLowerCase() || "g-cafe";
}

function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && staffRoles.includes(value as StaffRole);
}

export function createStaffSession(session: Omit<StaffSession, "issuedAt">) {
  const payload = Buffer.from(
    JSON.stringify({ ...session, issuedAt: Date.now() }),
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
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<StaffSession>;
    if (
      !isStaffRole(decoded.role) ||
      !decoded.restaurantId ||
      !decoded.restaurantSlug ||
      !decoded.restaurantName ||
      !decoded.issuedAt
    ) {
      return null;
    }
    return {
      role: decoded.role,
      restaurantId: decoded.restaurantId,
      restaurantSlug: decoded.restaurantSlug,
      restaurantName: decoded.restaurantName,
      issuedAt: decoded.issuedAt,
    };
  } catch {
    return null;
  }
}

export async function validateStaffLogin({
  role,
  pin,
  restaurantSlug,
}: {
  role: StaffRole;
  pin: string;
  restaurantSlug?: string | null;
}) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: normalizeSlug(restaurantSlug) },
    select: {
      id: true,
      slug: true,
      name: true,
      staffCredentials: {
        where: { role, isActive: true },
        select: { pinHash: true },
        take: 1,
      },
    },
  });
  if (!restaurant) return null;

  const credential = restaurant.staffCredentials[0];
  const suppliedHash = hashStaffPin(restaurant.id, role, pin);
  const storedHash = credential?.pinHash;
  const dbPinMatches =
    Boolean(storedHash) &&
    Buffer.byteLength(storedHash!) === Buffer.byteLength(suppliedHash) &&
    timingSafeEqual(Buffer.from(storedHash!), Buffer.from(suppliedHash));
  const fallbackPinMatches = !storedHash && rolePin(role) === pin.trim();

  if (!dbPinMatches && !fallbackPinMatches) return null;

  return {
    role,
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
  };
}

export function staffPinStatus(role: StaffRole) {
  const pin = rolePin(role);
  return {
    configured: Boolean(pin),
    length: pin.length,
  };
}

export async function getStaffRole() {
  const session = await getStaffSession();
  return session?.role ?? null;
}

export async function getStaffSession() {
  const cookieStore = await cookies();
  return verifyStaffSessionToken(cookieStore.get(staffCookieName)?.value);
}

export async function requireRole(allowed: StaffRole[]) {
  const session = await getStaffSession();
  if (!session || !allowed.includes(session.role)) {
    redirect(`/staff/login?next=${encodeURIComponent(defaultPathFor(allowed[0]))}`);
  }
  return session;
}

export function requireRequestRole(request: NextRequest, allowed: StaffRole[]) {
  const session = verifyStaffSessionToken(request.cookies.get(staffCookieName)?.value);
  if (!session || !allowed.includes(session.role)) {
    return null;
  }
  return session;
}

function defaultPathFor(role: StaffRole) {
  if (role === "admin") return "/admin";
  return `/staff/${role}`;
}
