import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function databaseProtocol() {
  try {
    return process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).protocol.replace(":", "") : "missing";
  } catch {
    return "invalid";
  }
}

function safeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Unknown error";
  return error.message.replace(/postgres(ql)?:\/\/[^@\s]+@/gi, "postgresql://***@").slice(0, 220);
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "ok",
      databaseProtocol: databaseProtocol(),
    });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        databaseProtocol: databaseProtocol(),
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: safeErrorMessage(error),
        errorCode:
          typeof error === "object" && error && "code" in error && typeof error.code === "string"
            ? error.code
            : "UNKNOWN",
      },
      { status: 503 },
    );
  }
}
