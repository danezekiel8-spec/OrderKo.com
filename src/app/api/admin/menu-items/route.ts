import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
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

    const item = await prisma.menuItem.create({
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
