import { NextResponse } from "next/server";
import { staffCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(staffCookieName);
  return response;
}
