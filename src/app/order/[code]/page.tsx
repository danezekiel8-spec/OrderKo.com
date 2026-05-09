import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderStatusClient } from "@/components/order-status-client";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await params;
  const query = await searchParams;
  const accessToken = typeof query.t === "string" ? query.t : "";

  if (!accessToken) notFound();

  const order = await prisma.order.findFirst({
    where: {
      orderCode: code.toUpperCase(),
      customerAccessToken: accessToken,
    },
    include: {
      restaurant: { select: { name: true, slug: true, currency: true } },
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  return (
    <OrderStatusClient
      initialOrder={{
        orderCode: order.orderCode,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        customerNote: order.customerNote,
        totalCents: order.totalCents,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        restaurant: order.restaurant,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          note: item.note,
          selectedOptions: JSON.parse(item.selectedOptionsJson || "[]"),
          lineTotalCents: item.lineTotalCents,
        })),
        events: order.statusEvents.map((event) => ({
          id: event.id,
          status: event.status,
          note: event.note,
          createdAt: event.createdAt.toISOString(),
        })),
      }}
      accessToken={accessToken}
    />
  );
}
