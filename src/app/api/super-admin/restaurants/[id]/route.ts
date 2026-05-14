import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminRequest } from "@/lib/super-admin-auth";

export const dynamic = "force-dynamic";

const serviceStatusSchema = z.object({
  isServiceActive: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = serviceStatusSchema.parse(await request.json());
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { isServiceActive: body.isServiceActive },
      select: {
        id: true,
        name: true,
        slug: true,
        isOpen: true,
        isServiceActive: true,
        currency: true,
        createdAt: true,
        _count: { select: { categories: true, menuItems: true, orders: true } },
      },
    });

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        createdAt: restaurant.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid service status.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update service status." },
      { status: 400 },
    );
  }
}
