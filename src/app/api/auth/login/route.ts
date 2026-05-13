import { NextResponse, type NextRequest } from "next/server";
import { createStaffSession, staffCookieName, validateStaffLogin, type StaffRole } from "@/lib/auth";

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
    restaurantSlug?: string;
  } | null;

  const key = `${requestKey(request)}:${body?.restaurantSlug ?? "unknown"}:${body?.role ?? "unknown"}`;
  const roleIsValid = Boolean(body?.role && roles.includes(body.role));
  const session = roleIsValid && body?.pin
    ? await validateStaffLogin({
        role: body.role!,
        pin: body.pin,
        restaurantSlug: body.restaurantSlug,
      })
    : null;

  if (!body?.role || !roleIsValid || !body.pin || !session) {
    if (recordFailedAttempt(key)) {
      return NextResponse.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429 });
    }
    return NextResponse.json({ error: "Invalid role or PIN." }, { status: 401 });
  }

  attempts.delete(key);
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
      maxAge: 60 * 60 * 12,
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
