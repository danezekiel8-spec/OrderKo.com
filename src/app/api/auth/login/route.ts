import { NextResponse, type NextRequest } from "next/server";
import { createStaffSession, staffCookieName, staffSessionMaxAgeSeconds, validateStaffLogin, type StaffRole } from "@/lib/auth";
import { checkRateLimit, clearRateLimit, rateLimitResponse, requestIp } from "@/lib/rate-limit";

const roles = ["cashier", "kitchen", "admin"];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    role?: StaffRole;
    pin?: string;
    restaurantSlug?: string;
  } | null;

  const key = `staff-login:${requestIp(request)}:${body?.restaurantSlug ?? "unknown"}:${body?.role ?? "unknown"}`;
  const roleIsValid = Boolean(body?.role && roles.includes(body.role));
  const session = roleIsValid && body?.pin
    ? await validateStaffLogin({
        role: body.role!,
        pin: body.pin,
        restaurantSlug: body.restaurantSlug,
      })
    : null;

  if (!body?.role || !roleIsValid || !body.pin || !session) {
    const rateLimit = checkRateLimit({ key, limit: 6, windowMs: 10 * 60 * 1000 });
    if (rateLimit.limited) return rateLimitResponse(rateLimit.resetAt, "Too many sign-in attempts. Try again in a few minutes.");
    return NextResponse.json({ error: "Invalid role or PIN." }, { status: 401 });
  }

  clearRateLimit(key);
  const response = NextResponse.json({
    ok: true,
    role: session.role,
    restaurant: {
      id: session.restaurantId,
      slug: session.restaurantSlug,
      name: session.restaurantName,
    },
  });
  try {
    response.cookies.set(staffCookieName, createStaffSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: staffSessionMaxAgeSeconds,
    });
  } catch (error) {
    console.error("Staff session creation failed", error);
    return NextResponse.json(
      { error: "Staff session is not configured. Add STAFF_SESSION_SECRET and redeploy." },
      { status: 500 },
    );
  }
  return response;
}
