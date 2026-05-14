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
  slug: true,
  isOpen: true,
  isServiceActive: true,
  isKioskEnabled: true,
  superAdminNotes: true,
  currency: true,
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
