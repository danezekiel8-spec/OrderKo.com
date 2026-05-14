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
      currency: true,
      createdAt: true,
      _count: { select: { categories: true, menuItems: true, orders: true } },
    },
  });

  return (
    <SuperAdminDashboard
      initialRestaurants={restaurants.map((restaurant) => ({
        ...restaurant,
        createdAt: restaurant.createdAt.toISOString(),
      }))}
    />
  );
}
