import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { hashStaffPin, type StaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminRequest } from "@/lib/super-admin-auth";

export const dynamic = "force-dynamic";

const pinSchema = z.string().trim().min(4, "PIN must be at least 4 characters.").max(12, "PIN must be 12 characters or fewer.");
const staffRoles = ["admin", "cashier", "kitchen"] as const satisfies StaffRole[];

const restaurantPatchSchema = z.object({
  isServiceActive: z.boolean().optional(),
  isKioskEnabled: z.boolean().optional(),
  superAdminNotes: z.string().trim().max(3000).optional(),
  staffPins: z
    .object({
      admin: pinSchema.optional().or(z.literal("")),
      cashier: pinSchema.optional().or(z.literal("")),
      kitchen: pinSchema.optional().or(z.literal("")),
    })
    .optional(),
});

const restaurantSelect = {
  id: true,
  name: true,
  description: true,
  address: true,
  slug: true,
  isOpen: true,
  isServiceActive: true,
  isKioskEnabled: true,
  superAdminNotes: true,
  currency: true,
  logoUrl: true,
  bannerImageUrl: true,
  createdAt: true,
  updatedAt: true,
  staffCredentials: {
    select: { role: true, isActive: true, updatedAt: true },
  },
  _count: { select: { categories: true, menuItems: true, orders: true } },
} as const;

function serializeRestaurant<T extends { createdAt: Date; updatedAt: Date; staffCredentials: { role: string; isActive: boolean; updatedAt: Date }[] }>(restaurant: T) {
  return {
    ...restaurant,
    createdAt: restaurant.createdAt.toISOString(),
    updatedAt: restaurant.updatedAt.toISOString(),
    staffCredentials: restaurant.staffCredentials.map((credential) => ({
      ...credential,
      updatedAt: credential.updatedAt.toISOString(),
    })),
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = restaurantPatchSchema.parse(await request.json());

    const restaurant = await prisma.$transaction(async (tx) => {
      const existing = await tx.restaurant.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new Error("Restaurant not found.");

      for (const role of staffRoles) {
        const pin = body.staffPins?.[role];
        if (!pin) continue;
        await tx.staffCredential.upsert({
          where: { restaurantId_role: { restaurantId: id, role } },
          create: {
            restaurantId: id,
            role,
            label: role[0].toUpperCase() + role.slice(1),
            pinHash: hashStaffPin(id, role, pin),
            isActive: true,
          },
          update: {
            pinHash: hashStaffPin(id, role, pin),
            isActive: true,
          },
        });
      }

      return tx.restaurant.update({
        where: { id },
        data: {
          ...(body.isServiceActive === undefined ? {} : { isServiceActive: body.isServiceActive }),
          ...(body.isKioskEnabled === undefined ? {} : { isKioskEnabled: body.isKioskEnabled }),
          ...(body.superAdminNotes === undefined ? {} : { superAdminNotes: body.superAdminNotes || null }),
        },
        select: restaurantSelect,
      });
    });

    return NextResponse.json({
      restaurant: serializeRestaurant(restaurant),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Check the restaurant update and try again.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update service status." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { orders: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    if (existing._count.orders > 0) {
      return NextResponse.json(
        { error: "Restaurants with orders cannot be deleted. Pause service instead to preserve operational history." },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.staffCredential.deleteMany({ where: { restaurantId: id } });
      await tx.menuItem.deleteMany({ where: { restaurantId: id } });
      await tx.category.deleteMany({ where: { restaurantId: id } });
      await tx.restaurant.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete restaurant." },
      { status: 400 },
    );
  }
}
