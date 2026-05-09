import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const accessToken = request.nextUrl.searchParams.get("t");

  if (!accessToken) {
    return NextResponse.json({ error: "Order access token is required." }, { status: 404 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderCode: code.toUpperCase(),
      customerAccessToken: accessToken,
    },
    include: {
      restaurant: { select: { name: true, currency: true } },
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderCode: order.orderCode,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerNote: order.customerNote,
      totalCents: order.totalCents,
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
      events: order.statusEvents,
    },
  });
}
