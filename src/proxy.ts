import { NextResponse, type NextRequest } from "next/server";

const staffCookieName = "orderko_staff_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasStaffSession = Boolean(request.cookies.get(staffCookieName)?.value);

  if (
    (pathname.startsWith("/staff") || pathname.startsWith("/admin")) &&
    !pathname.startsWith("/staff/login") &&
    !hasStaffSession
  ) {
    const loginUrl = new URL("/staff/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*"],
};
