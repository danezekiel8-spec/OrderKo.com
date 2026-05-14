import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export const superAdminCookieName = "orderko_super_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 3;

function configuredSecret() {
  const value = process.env.ORDERKO_SUPER_ADMIN_SECRET?.trim().replace(/^['"]|['"]$/g, "");
  if (value) return value;
  if (process.env.NODE_ENV === "production") return null;
  return "development-super-admin-secret";
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function superAdminSecretConfigured() {
  return Boolean(configuredSecret());
}

export function isSuperAdminSecretValid(secret: string) {
  const expected = configuredSecret();
  if (!expected) return false;
  const supplied = secret.trim();
  return (
    Buffer.byteLength(supplied) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  );
}

export function createSuperAdminSession() {
  const secret = configuredSecret();
  if (!secret) throw new Error("ORDERKO_SUPER_ADMIN_SECRET must be configured.");
  const payload = Buffer.from(
    JSON.stringify({ role: "super-admin", issuedAt: Date.now() }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySuperAdminSessionToken(token?: string | null) {
  const secret = configuredSecret();
  if (!secret || !token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload, secret);
  if (
    Buffer.byteLength(signature) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      role?: string;
      issuedAt?: number;
    };
    if (decoded.role !== "super-admin" || !decoded.issuedAt) return false;
    return Date.now() - decoded.issuedAt <= sessionMaxAgeSeconds * 1000;
  } catch {
    return false;
  }
}

export async function requireSuperAdminSession() {
  const cookieStore = await cookies();
  if (!verifySuperAdminSessionToken(cookieStore.get(superAdminCookieName)?.value)) {
    redirect("/super-admin/login");
  }
}

export function requireSuperAdminRequest(request: NextRequest) {
  return verifySuperAdminSessionToken(request.cookies.get(superAdminCookieName)?.value);
}

export function superAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  };
}
