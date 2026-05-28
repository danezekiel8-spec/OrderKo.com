import { NextResponse, type NextRequest } from "next/server";
import {
  createSuperAdminSession,
  isSuperAdminSecretValid,
  superAdminCookieName,
  superAdminCookieOptions,
} from "@/lib/super-admin-auth";
import { checkRateLimit, clearRateLimit, rateLimitResponse, requestIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { secret?: string } | null;
  const key = `super-admin-login:${requestIp(request)}`;

  if (!body?.secret || !isSuperAdminSecretValid(body.secret)) {
    const rateLimit = checkRateLimit({ key, limit: 5, windowMs: 15 * 60 * 1000 });
    if (rateLimit.limited) return rateLimitResponse(rateLimit.resetAt, "Too many sign-in attempts. Try again in a few minutes.");
    return NextResponse.json({ error: "Invalid super-admin secret." }, { status: 401 });
  }

  clearRateLimit(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(superAdminCookieName, createSuperAdminSession(), superAdminCookieOptions());
  return response;
}
