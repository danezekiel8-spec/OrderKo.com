import { NextResponse } from "next/server";
import { superAdminCookieName } from "@/lib/super-admin-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(superAdminCookieName);
  return response;
}
