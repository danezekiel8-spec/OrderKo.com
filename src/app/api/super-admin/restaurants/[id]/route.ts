import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { recordAuditLog, safeAuditLog } from "@/lib/audit-log";
import { hashStaffPin, type StaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminRequest } from "@/lib/super-admin-auth";
import { restaurantPinSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const staffRoles = ["admin", "cashier", "kitchen"] as const satisfies StaffRole[];

const restaurantPatchSchema = z.object({
  isServiceActive: z.boolean().optional(),
  isKioskEnabled: z.boolean().optional(),
  superAdminNotes: z.string().trim().max(3000).optional(),
  subscriptionStatus: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "PAUSED", "CANCELED"]).optional(),
  subscriptionNotes: z.string().trim().max(3000).optional(),
  pausedReason: z.string().trim().max(500).optional(),
  staffPins: z
    .object({
      admin: restaurantPinSchema.optional().or(z.literal("")),
      cashier: restaurantPinSchema.optional().or(z.literal("")),
      kitchen: restaurantPinSchema.optional().or(z.literal("")),
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
  subscriptionStatus: true,
  subscriptionNotes: true,
  pausedReason: true,
  pausedAt: true,
  currency: true,
  logoUrl: true,
  bannerImageUrl: true,
  createdAt: true,
  updatedAt: true,
  staffCredentials: {
    select: { role: true, isActive: true, updatedAt: true },
  },
  orders: {
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { status: true, paymentStatus: true },
  },
  _count: { select: { categories: true, menuItems: true, orders: true } },
} as const;

function serializeRestaurant<T extends { createdAt: Date; updatedAt: Date; pausedAt?: Date | null; staffCredentials: { role: string; isActive: boolean; updatedAt: Date }[] }>(restaurant: T) {
  return {
    ...restaurant,
    createdAt: restaurant.createdAt.toISOString(),
    updatedAt: restaurant.updatedAt.toISOString(),
    pausedAt: restaurant.pausedAt?.toISOString() ?? null,
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
      const existing = await tx.restaurant.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          isServiceActive: true,
          isKioskEnabled: true,
          subscriptionStatus: true,
        },
      });
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
        await recordAuditLog(tx, {
          restaurantId: id,
          actorType: "super_admin",
          action: "staff_pin.reset",
          entityType: "staffCredential",
          entityLabel: role,
          metadata: { role },
          request,
        });
      }

      const updated = await tx.restaurant.update({
        where: { id },
        data: {
          ...(body.isServiceActive === undefined ? {} : { isServiceActive: body.isServiceActive }),
          ...(body.isKioskEnabled === undefined ? {} : { isKioskEnabled: body.isKioskEnabled }),
          ...(body.superAdminNotes === undefined ? {} : { superAdminNotes: body.superAdminNotes || null }),
          ...(body.subscriptionStatus === undefined ? {} : { subscriptionStatus: body.subscriptionStatus }),
          ...(body.subscriptionNotes === undefined ? {} : { subscriptionNotes: body.subscriptionNotes || null }),
          ...(body.pausedReason === undefined ? {} : { pausedReason: body.pausedReason || null }),
          ...(body.isServiceActive === false ? { pausedAt: new Date() } : {}),
          ...(body.isServiceActive === true ? { pausedAt: null, pausedReason: null } : {}),
        },
        select: restaurantSelect,
      });
      if (body.isServiceActive !== undefined && body.isServiceActive !== existing.isServiceActive) {
        await recordAuditLog(tx, {
          restaurantId: id,
          actorType: "super_admin",
          action: body.isServiceActive ? "restaurant.resumed" : "restaurant.paused",
          entityType: "restaurant",
          entityId: id,
          entityLabel: updated.name,
          metadata: { previous: existing.isServiceActive, next: body.isServiceActive, reason: body.pausedReason ?? null },
          request,
        });
      }
      if (body.isKioskEnabled !== undefined && body.isKioskEnabled !== existing.isKioskEnabled) {
        await recordAuditLog(tx, {
          restaurantId: id,
          actorType: "super_admin",
          action: body.isKioskEnabled ? "kiosk.enabled" : "kiosk.disabled",
          entityType: "restaurant",
          entityId: id,
          entityLabel: updated.name,
          request,
        });
      }
      if (body.subscriptionStatus !== undefined && body.subscriptionStatus !== existing.subscriptionStatus) {
        await recordAuditLog(tx, {
          restaurantId: id,
          actorType: "super_admin",
          action: "subscription.status_changed",
          entityType: "restaurant",
          entityId: id,
          entityLabel: updated.name,
          metadata: { previousStatus: existing.subscriptionStatus, newStatus: body.subscriptionStatus },
          request,
        });
      }
      if (body.superAdminNotes !== undefined || body.subscriptionNotes !== undefined) {
        await recordAuditLog(tx, {
          restaurantId: id,
          actorType: "super_admin",
          action: "restaurant.updated",
          entityType: "restaurant",
          entityId: id,
          entityLabel: updated.name,
          metadata: {
            superAdminNotesUpdated: body.superAdminNotes !== undefined,
            subscriptionNotesUpdated: body.subscriptionNotes !== undefined,
          },
          request,
        });
      }
      return updated;
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
      await recordAuditLog(tx, {
        restaurantId: id,
        actorType: "super_admin",
        action: "restaurant.deleted",
        entityType: "restaurant",
        entityId: id,
        entityLabel: existing.name,
        request,
      });
      await tx.staffCredential.deleteMany({ where: { restaurantId: id } });
      await tx.menuItem.deleteMany({ where: { restaurantId: id } });
      await tx.category.deleteMany({ where: { restaurantId: id } });
      await tx.restaurant.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    await safeAuditLog({
      actorType: "super_admin",
      action: "restaurant.delete_failed",
      entityType: "restaurant",
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      request,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete restaurant." },
      { status: 400 },
    );
  }
}
