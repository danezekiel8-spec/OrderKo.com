import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "ok" });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        errorCode:
          typeof error === "object" && error && "code" in error && typeof error.code === "string"
            ? error.code
            : "UNKNOWN",
      },
      { status: 503 },
    );
  }
}
