import { NextResponse, type NextRequest } from "next/server";
import { createStaffSession, isPinValid, staffCookieName, staffPinStatus, type StaffRole } from "@/lib/auth";

const roles = ["cashier", "kitchen", "admin"];
const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 5 * 60 * 1000;
const maxAttempts = 8;

function requestKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > maxAttempts;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    role?: StaffRole;
    pin?: string;
  } | null;

  const key = `${requestKey(request)}:${body?.role ?? "unknown"}`;
  if (!body?.role || !roles.includes(body.role) || !body.pin || !isPinValid(body.role, body.pin)) {
    if (body?.role && roles.includes(body.role)) {
      const status = staffPinStatus(body.role);
      console.warn("Staff login failed", {
        role: body.role,
        suppliedPinLength: body.pin?.trim().length ?? 0,
        configuredPinLength: status.length,
        pinConfigured: status.configured,
      });
    }
    if (recordFailedAttempt(key)) {
      return NextResponse.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429 });
    }
    return NextResponse.json({ error: "Invalid role or PIN." }, { status: 401 });
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true, role: body.role });
  response.cookies.set(staffCookieName, createStaffSession(body.role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
