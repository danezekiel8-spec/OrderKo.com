import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { leadCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 10 * 60 * 1000;
const maxAttempts = 5;

function requestKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function isRateLimited(key: string) {
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
  const key = requestKey(request);
  if (isRateLimited(key)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  }

  try {
    const body = leadCreateSchema.parse(await request.json());

    if (body.companyWebsite) {
      return NextResponse.json({ ok: true });
    }

    await prisma.lead.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        restaurantName: body.restaurantName,
        phone: body.phone || null,
        message: body.message || null,
        source: "landing_page",
        status: "NEW",
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Check the form and try again.", issues: error.issues }, { status: 400 });
    }

    console.error("Lead capture failed", error);
    return NextResponse.json({ error: "Could not submit your request. Please try again." }, { status: 500 });
  }
}
