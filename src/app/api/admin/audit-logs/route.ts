import { NextResponse, type NextRequest } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const logs = await prisma.auditLog.findMany({
    where: { restaurantId: session.restaurantId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      metadata: safeJson(log.metadataJson),
      metadataJson: undefined,
    })),
  });
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}
