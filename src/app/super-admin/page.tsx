import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/super-admin-auth";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";

export const dynamic = "force-dynamic";

const subscriptionStatuses = ["TRIAL", "ACTIVE", "PAST_DUE", "PAUSED", "CANCELED"] as const;

function normalizeSubscriptionStatus(status: string) {
  return subscriptionStatuses.includes(status as (typeof subscriptionStatuses)[number])
    ? (status as (typeof subscriptionStatuses)[number])
    : "TRIAL";
}

export default async function SuperAdminPage() {
  await requireSuperAdminSession();

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
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
    },
  });

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      restaurantName: true,
      phone: true,
      message: true,
      status: true,
      source: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <SuperAdminDashboard
      initialRestaurants={restaurants.map((restaurant) => ({
        ...restaurant,
        createdAt: restaurant.createdAt.toISOString(),
        updatedAt: restaurant.updatedAt.toISOString(),
        pausedAt: restaurant.pausedAt?.toISOString() ?? null,
        subscriptionStatus: normalizeSubscriptionStatus(restaurant.subscriptionStatus),
        staffCredentials: restaurant.staffCredentials.map((credential) => ({
          ...credential,
          updatedAt: credential.updatedAt.toISOString(),
        })),
      }))}
      initialLeads={leads.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      }))}
    />
  );
}
