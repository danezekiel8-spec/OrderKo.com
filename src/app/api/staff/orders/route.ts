import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const role = requireRequestRole(request, ["cashier", "kitchen", "admin"]);
  if (!role) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const requestedView = searchParams.get("view") ?? role;
  const view = requestedView === "cashier" || requestedView === "kitchen" ? requestedView : role;
  if (role !== "admin" && view !== role) {
    return NextResponse.json({ error: "This staff role cannot access that order view." }, { status: 403 });
  }
  const q = searchParams.get("q")?.trim().toUpperCase();

  const where: Prisma.OrderWhereInput =
    view === "kitchen"
      ? {
          paymentStatus: "PAID",
          status: { in: ["PAYMENT_CONFIRMED", "PREPARING", "ALMOST_READY", "READY_FOR_PICKUP"] },
        }
      : {
          status: { notIn: ["COMPLETED", "CANCELED"] },
        };

  const orders = await prisma.order.findMany({
    where: {
      ...where,
      ...(q ? { orderCode: { contains: q } } : {}),
    },
    include: {
      restaurant: { select: { name: true, currency: true } },
      items: { orderBy: { id: "asc" } },
    },
    orderBy: { createdAt: "asc" },
    take: 80,
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalCents: order.totalCents,
      customerName: order.customerName,
      customerNote: order.customerNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      restaurant: order.restaurant,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        note: item.note,
        selectedOptions: JSON.parse(item.selectedOptionsJson || "[]"),
        lineTotalCents: item.lineTotalCents,
      })),
    })),
  });
}
