import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoryMutationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = categoryMutationSchema.parse(await request.json());
    const existing = await prisma.category.findFirst({
      where: { id, restaurantId: session.restaurantId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Category not found." }, { status: 404 });

    const category = await prisma.category.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        sortOrder: body.sortOrder,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid category.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update category." },
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
  const itemCount = await prisma.menuItem.count({ where: { categoryId: id, restaurantId: session.restaurantId } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: "Move or delete every menu item in this category before deleting it." },
      { status: 409 },
    );
  }

  const result = await prisma.category.deleteMany({ where: { id, restaurantId: session.restaurantId } });
  if (result.count === 0) return NextResponse.json({ error: "Category not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
