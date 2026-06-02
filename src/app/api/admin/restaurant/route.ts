import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { recordAuditLog } from "@/lib/audit-log";
import { requireRequestRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restaurantSettingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const session = requireRequestRole(request, ["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = restaurantSettingsSchema.parse(await request.json());
    const updated = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.update({
        where: { id: session.restaurantId },
        data: {
          ...body,
          logoUrl: body.logoUrl || null,
          bannerImageUrl: body.bannerImageUrl || null,
        },
        include: {
          staffCredentials: { select: { role: true, isActive: true } },
        },
      });
      await recordAuditLog(tx, {
        restaurantId: session.restaurantId,
        actorType: "staff",
        actorRole: session.role,
        action: "restaurant.settings_updated",
        entityType: "restaurant",
        entityId: restaurant.id,
        entityLabel: restaurant.name,
        metadata: { isOpen: restaurant.isOpen, slug: restaurant.slug },
        request,
      });
      return restaurant;
    });

    return NextResponse.json({
      restaurant: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        address: updated.address,
        slug: updated.slug,
        currency: updated.currency,
        logoUrl: updated.logoUrl,
        bannerImageUrl: updated.bannerImageUrl,
        isOpen: updated.isOpen,
        staffCredentials: updated.staffCredentials,
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
