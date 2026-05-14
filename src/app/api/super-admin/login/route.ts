import { NextResponse, type NextRequest } from "next/server";
import {
  createSuperAdminSession,
  isSuperAdminSecretValid,
  superAdminCookieName,
  superAdminCookieOptions,
} from "@/lib/super-admin-auth";

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
  const body = (await request.json().catch(() => null)) as { secret?: string } | null;
  const key = requestKey(request);

  if (!body?.secret || !isSuperAdminSecretValid(body.secret)) {
    if (recordFailedAttempt(key)) {
      return NextResponse.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429 });
    }
    return NextResponse.json({ error: "Invalid super-admin secret." }, { status: 401 });
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(superAdminCookieName, createSuperAdminSession(), superAdminCookieOptions());
  return response;
}
