import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminRequest } from "@/lib/super-admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const restaurantId = request.nextUrl.searchParams.get("restaurantId") || undefined;
  const logs = await prisma.auditLog.findMany({
    where: restaurantId ? { restaurantId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { restaurant: { select: { name: true, slug: true } } },
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      metadata: safeJson(log.metadataJson),
      restaurant: log.restaurant,
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
