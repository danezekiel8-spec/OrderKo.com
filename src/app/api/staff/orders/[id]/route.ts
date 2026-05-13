import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireRequestRole } from "@/lib/auth";
import { canTransition } from "@/lib/order-state";
import { prisma } from "@/lib/prisma";
import { staffOrderActionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = requireRequestRole(request, ["cashier", "kitchen", "admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = staffOrderActionSchema.parse(await request.json().catch(() => null));

    const order = await prisma.order.findFirst({ where: { id, restaurantId: session.restaurantId } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (body.action === "markPaid") {
      if (!["cashier", "admin"].includes(session.role)) {
        return NextResponse.json({ error: "Only cashier/admin can mark paid." }, { status: 403 });
      }
      if (order.status !== "AWAITING_PAYMENT") {
        return NextResponse.json({ error: "Only awaiting-payment orders can be marked paid." }, { status: 409 });
      }
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
          where: { id, restaurantId: session.restaurantId, status: "AWAITING_PAYMENT", paymentStatus: "UNPAID" },
          data: {
            paymentStatus: "PAID",
            status: "PAYMENT_CONFIRMED",
            paidAt: new Date(),
          },
        });
        if (result.count === 0) return null;
        await tx.orderStatusEvent.create({
          data: { orderId: id, status: "PAYMENT_CONFIRMED", note: "Payment confirmed by cashier." },
        });
        return tx.order.findUnique({ where: { id } });
      });
      if (!updated) return NextResponse.json({ error: "Order was already updated. Refresh and try again." }, { status: 409 });
      return NextResponse.json({ order: updated });
    }

    if (body.action === "cancel") {
      if (!["cashier", "admin"].includes(session.role)) {
        return NextResponse.json({ error: "Only cashier/admin can cancel orders." }, { status: 403 });
      }
      if (session.role === "cashier" && order.status !== "AWAITING_PAYMENT") {
        return NextResponse.json({ error: "Ask an admin to cancel orders after payment is confirmed." }, { status: 403 });
      }
      if (["COMPLETED", "CANCELED"].includes(order.status)) {
        return NextResponse.json({ error: "This order is already closed." }, { status: 409 });
      }
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
          where: { id, restaurantId: session.restaurantId, status: { notIn: ["COMPLETED", "CANCELED"] } },
          data: {
            paymentStatus: "CANCELED",
            status: "CANCELED",
            canceledAt: new Date(),
          },
        });
        if (result.count === 0) return null;
        await tx.orderStatusEvent.create({
          data: { orderId: id, status: "CANCELED", note: "Order canceled by staff." },
        });
        return tx.order.findUnique({ where: { id } });
      });
      if (!updated) return NextResponse.json({ error: "This order is already closed." }, { status: 409 });
      return NextResponse.json({ order: updated });
    }

    if (body.action === "setStatus") {
      if (!["kitchen", "admin"].includes(session.role)) {
        return NextResponse.json({ error: "Only kitchen/admin can update preparation status." }, { status: 403 });
      }
      if (order.paymentStatus !== "PAID") {
        return NextResponse.json({ error: "Order must be paid before kitchen can update it." }, { status: 409 });
      }
      if (!canTransition(order.status, body.status)) {
        return NextResponse.json({ error: "Invalid order status transition." }, { status: 409 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.order.updateMany({
          where: { id, restaurantId: session.restaurantId, status: order.status, paymentStatus: "PAID" },
          data: {
            status: body.status,
            completedAt: body.status === "COMPLETED" ? new Date() : undefined,
          },
        });
        if (result.count === 0) return null;
        await tx.orderStatusEvent.create({
          data: {
            orderId: id,
            status: body.status,
            note:
              body.status === "READY_FOR_PICKUP"
                ? "Order marked ready. Notification placeholder triggered."
                : "Status updated by kitchen.",
          },
        });
        return tx.order.findUnique({ where: { id } });
      });
      if (!updated) return NextResponse.json({ error: "Order was already updated. Refresh and try again." }, { status: 409 });
      return NextResponse.json({
        order: updated,
        notification: body.status === "READY_FOR_PICKUP" ? "placeholder" : null,
      });
    }

    return NextResponse.json({ error: "Unsupported order action." }, { status: 400 });
  } catch (error) {
    return handleStaffOrderError(error);
  }
}

export function handleStaffOrderError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid order action.", issues: error.issues }, { status: 400 });
  }
  console.error("Staff order action failed", error);
  return NextResponse.json({ error: "Could not update order." }, { status: 500 });
}
