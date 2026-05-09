import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restaurantSettingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const role = requireRequestRole(request, ["admin"]);
  if (!role) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = restaurantSettingsSchema.parse(await request.json());
    const restaurant = await prisma.restaurant.findFirst({ orderBy: { createdAt: "asc" } });
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: body,
    });

    return NextResponse.json({
      restaurant: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        address: updated.address,
        slug: updated.slug,
        currency: updated.currency,
        isOpen: updated.isOpen,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid restaurant settings.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update restaurant settings." },
      { status: 400 },
    );
  }
}
