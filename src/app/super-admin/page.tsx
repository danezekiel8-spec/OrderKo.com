import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/lib/super-admin-auth";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  await requireSuperAdminSession();

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
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
