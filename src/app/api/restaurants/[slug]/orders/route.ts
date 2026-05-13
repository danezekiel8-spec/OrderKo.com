import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { parseOptionGroups } from "@/lib/menu";
import { placeOrderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function orderCodePrefix(slug: string) {
  const prefix = slug.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
  return prefix || "OK";
}

function customerAccessToken() {
  return randomBytes(24).toString("base64url");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const body = placeOrderSchema.parse(await request.json());

    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }
    if (!restaurant.isOpen) {
      return NextResponse.json({ error: "This restaurant is currently closed." }, { status: 409 });
    }

    const existing = await prisma.order.findFirst({
      where: { restaurantId: restaurant.id, submissionKey: body.submissionKey },
      select: { id: true, orderCode: true, orderNumber: true, status: true, customerAccessToken: true },
    });
    if (existing) {
      return NextResponse.json({ order: existing, duplicate: true });
    }

    const itemIds = [...new Set(body.items.map((item) => item.menuItemId))];
    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        id: { in: itemIds },
        isActive: true,
      },
    });
    const itemMap = new Map(menuItems.map((item) => [item.id, item]));

    const orderItems = body.items.map((input) => {
      const menuItem = itemMap.get(input.menuItemId);
      if (!menuItem || menuItem.isSoldOut) {
        throw new Error("One or more items are unavailable.");
      }

      const optionGroups = parseOptionGroups(menuItem.optionGroupsJson);
      const selectedOptions = input.selectedOptions.map((selected) => {
        const group = optionGroups.find((candidate) => candidate.name === selected.groupName);
        const option = group?.options.find((candidate) => candidate.name === selected.optionName);
        if (!group || !option || option.priceCents !== selected.priceCents) {
          throw new Error("One or more customizations are no longer available.");
        }
        return selected;
      });

      for (const group of optionGroups) {
        const selections = selectedOptions.filter((selected) => selected.groupName === group.name);
        if (group.required && selections.length === 0) {
          throw new Error(`${group.name} is required for ${menuItem.name}.`);
        }
        if (selections.length > group.maxChoices) {
          throw new Error(`Too many choices selected for ${group.name}.`);
        }
      }

      const optionsTotal = selectedOptions.reduce((sum, option) => sum + option.priceCents, 0);
      const unitPriceCents = menuItem.priceCents + optionsTotal;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: input.quantity,
        note: input.note,
        selectedOptionsJson: JSON.stringify(selectedOptions),
        unitPriceCents,
        lineTotalCents: unitPriceCents * input.quantity,
      };
    });

    const totalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const prefix = orderCodePrefix(restaurant.slug);

    let order:
      | {
          id: string;
          orderCode: string;
          orderNumber: number;
          customerAccessToken: string | null;
          status: "AWAITING_PAYMENT" | "PAYMENT_CONFIRMED" | "PREPARING" | "ALMOST_READY" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELED";
        }
      | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const latest = await tx.order.aggregate({
            where: { restaurantId: restaurant.id },
            _max: { orderNumber: true },
          });
          const orderNumber = (latest._max.orderNumber ?? 0) + 1;
          const orderCode = `${prefix}-${orderNumber.toString().padStart(3, "0")}`;

          return tx.order.create({
            data: {
              restaurantId: restaurant.id,
              orderNumber,
              orderCode,
              submissionKey: body.submissionKey,
              customerAccessToken: customerAccessToken(),
              customerName: body.customerName || null,
              customerNote: body.customerNote || null,
              totalCents,
              items: { create: orderItems },
              statusEvents: {
                create: {
                  status: "AWAITING_PAYMENT",
                  note: "Order placed by customer.",
                },
              },
            },
            select: { id: true, orderCode: true, orderNumber: true, status: true, customerAccessToken: true },
          });
        });
        break;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
          if (target.includes("submissionKey")) {
            const duplicate = await prisma.order.findFirst({
              where: { restaurantId: restaurant.id, submissionKey: body.submissionKey },
              select: { id: true, orderCode: true, orderNumber: true, status: true, customerAccessToken: true },
            });
            if (duplicate) {
              order = duplicate;
              break;
            }
          }
        }
        const canRetry = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2;
        if (!canRetry) throw error;
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Could not reserve an order number. Please try again." }, { status: 409 });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid order data.", issues: error.issues }, { status: 400 });
    }
    console.error("Customer order creation failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not place order." },
      { status: 400 },
    );
  }
}
