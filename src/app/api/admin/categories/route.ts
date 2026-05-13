import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoryMutationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const role = requireRequestRole(request, ["admin"]);
  if (!role) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = categoryMutationSchema.parse(await request.json());
    const restaurant = await prisma.restaurant.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

    const category = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: body.name,
        sortOrder: body.sortOrder,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid category.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create category." },
      { status: 400 },
    );
  }
}
