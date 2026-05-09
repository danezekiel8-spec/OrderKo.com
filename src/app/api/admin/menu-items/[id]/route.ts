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
  const role = requireRequestRole(request, ["admin"]);
  if (!role) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = menuItemMutationSchema.partial().parse(await request.json());
    if (body.optionGroupsJson !== undefined) JSON.parse(body.optionGroupsJson || "[]");

    const item = await prisma.menuItem.update({
      where: { id },
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
  const role = requireRequestRole(request, ["admin"]);
  if (!role) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await context.params;
  await prisma.menuItem.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
