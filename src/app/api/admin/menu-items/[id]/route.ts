import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { recordAuditLog } from "@/lib/audit-log";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { menuItemMutationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = menuItemMutationSchema.partial().parse(await request.json());
    if (body.optionGroupsJson !== undefined) JSON.parse(body.optionGroupsJson || "[]");
    if (body.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: body.categoryId, restaurantId: session.restaurantId },
        select: { id: true },
      });
      if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const item = await prisma.$transaction(async (tx) => {
      const result = await tx.menuItem.updateMany({
        where: { id, restaurantId: session.restaurantId },
        data: {
          name: body.name,
          description: body.description,
          priceCents: body.priceCents,
          categoryId: body.categoryId,
          imageUrl: body.imageUrl === undefined ? undefined : body.imageUrl || null,
          optionGroupsJson: body.optionGroupsJson,
          isSoldOut: body.isSoldOut,
        },
      });
      if (result.count === 0) return null;
      const updated = await tx.menuItem.findUnique({ where: { id } });
      if (updated) {
        await recordAuditLog(tx, {
          restaurantId: session.restaurantId,
          actorType: "staff",
          actorRole: session.role,
          action: body.isSoldOut === undefined ? "menu_item.updated" : "menu_item.sold_out_toggled",
          entityType: "menuItem",
          entityId: updated.id,
          entityLabel: updated.name,
          metadata: { isSoldOut: updated.isSoldOut, priceCents: updated.priceCents },
          request,
        });
      }
      return updated;
    });
    if (!item) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid menu item.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update menu item." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await context.params;
  const existing = await prisma.menuItem.findFirst({
    where: { id, restaurantId: session.restaurantId },
    select: { id: true, name: true },
  });
  if (!existing) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.menuItem.updateMany({
      where: { id, restaurantId: session.restaurantId },
      data: { isActive: false },
    });
    if (deleted.count > 0) {
      await recordAuditLog(tx, {
        restaurantId: session.restaurantId,
        actorType: "staff",
        actorRole: session.role,
        action: "menu_item.deleted",
        entityType: "menuItem",
        entityId: existing.id,
        entityLabel: existing.name,
        request,
      });
    }
    return deleted;
  });
  if (result.count === 0) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
