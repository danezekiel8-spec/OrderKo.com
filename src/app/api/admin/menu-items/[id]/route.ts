import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
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
      return tx.menuItem.findUnique({ where: { id } });
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
  const result = await prisma.menuItem.updateMany({
    where: { id, restaurantId: session.restaurantId },
    data: { isActive: false },
  });
  if (result.count === 0) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
