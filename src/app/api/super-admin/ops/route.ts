import { NextResponse, type NextRequest } from "next/server";
import { leadNotificationEmailStatus } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminRequest } from "@/lib/super-admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    latestOrder,
    latestLead,
    latestUploadFailure,
    latestEmailFailure,
    recentFailures,
    activeRestaurantCount,
    pausedRestaurantCount,
    totalOrdersToday,
    ordersAwaitingPayment,
    ordersPaidNotCompleted,
  ] = await Promise.all([
    prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orderCode: true, createdAt: true, restaurant: { select: { name: true, slug: true } } },
    }),
    prisma.lead.findFirst({
      orderBy: { createdAt: "desc" },
      select: { restaurantName: true, email: true, createdAt: true, status: true },
    }),
    prisma.auditLog.findFirst({ where: { action: "upload.failed" }, orderBy: { createdAt: "desc" } }),
    prisma.auditLog.findFirst({ where: { action: "lead.email_failed" }, orderBy: { createdAt: "desc" } }),
    prisma.auditLog.findMany({
      where: { action: { contains: "failed" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { restaurant: { select: { name: true, slug: true } } },
    }),
    prisma.restaurant.count({ where: { isServiceActive: true } }),
    prisma.restaurant.count({ where: { isServiceActive: false } }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: "AWAITING_PAYMENT", paymentStatus: "UNPAID" } }),
    prisma.order.count({ where: { paymentStatus: "PAID", status: { notIn: ["COMPLETED", "CANCELED"] } } }),
  ]);

  return NextResponse.json({
    app: "ok",
    database: "ok",
    leadEmail: leadNotificationEmailStatus(),
    checkedAt: new Date().toISOString(),
    latestOrder: latestOrder
      ? {
          ...latestOrder,
          createdAt: latestOrder.createdAt.toISOString(),
        }
      : null,
    latestLead: latestLead ? { ...latestLead, createdAt: latestLead.createdAt.toISOString() } : null,
    latestUploadFailure: serializeAudit(latestUploadFailure),
    latestEmailFailure: serializeAudit(latestEmailFailure),
    recentFailures: recentFailures.map(serializeAudit),
    counts: {
      activeRestaurantCount,
      pausedRestaurantCount,
      totalOrdersToday,
      ordersAwaitingPayment,
      ordersPaidNotCompleted,
    },
  });
}

function serializeAudit<T extends { createdAt: Date; metadataJson: string } | null>(log: T) {
  if (!log) return null;
  return {
    ...log,
    createdAt: log.createdAt.toISOString(),
    metadata: safeJson(log.metadataJson),
    metadataJson: undefined,
  };
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}
