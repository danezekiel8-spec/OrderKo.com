import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { recordAuditLog } from "@/lib/audit-log";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { menuItemMutationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = menuItemMutationSchema.parse(await request.json());
    JSON.parse(body.optionGroupsJson || "[]");

    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, restaurantId: session.restaurantId },
      select: { restaurantId: true },
    });
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.menuItem.create({
        data: {
          restaurantId: session.restaurantId,
          categoryId: body.categoryId,
          name: body.name,
          description: body.description,
          priceCents: body.priceCents,
          imageUrl: body.imageUrl || null,
          optionGroupsJson: body.optionGroupsJson || "[]",
          isSoldOut: body.isSoldOut,
        },
      });
      await recordAuditLog(tx, {
        restaurantId: session.restaurantId,
        actorType: "staff",
        actorRole: session.role,
        action: "menu_item.created",
        entityType: "menuItem",
        entityId: created.id,
        entityLabel: created.name,
        metadata: { priceCents: created.priceCents, isSoldOut: created.isSoldOut },
        request,
      });
      return created;
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid menu item.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create menu item." },
      { status: 400 },
    );
  }
}
