import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireRole(["admin"]);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      menuItems: { where: { isActive: true }, orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }] },
    },
  });

  if (!restaurant) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8f5] px-4">
        <p className="rounded-lg bg-white p-6 text-slate-600">Run the seed command to create demo restaurant data.</p>
      </main>
    );
  }

  const [totalOrders, completedOrders, canceledOrders, average, orderItems] = await Promise.all([
    prisma.order.count({ where: { restaurantId: restaurant.id } }),
    prisma.order.count({ where: { restaurantId: restaurant.id, status: "COMPLETED" } }),
    prisma.order.count({ where: { restaurantId: restaurant.id, status: "CANCELED" } }),
    prisma.order.aggregate({ where: { restaurantId: restaurant.id }, _avg: { totalCents: true } }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { restaurantId: restaurant.id, status: { not: "CANCELED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  return (
    <AdminDashboard
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        slug: restaurant.slug,
        currency: restaurant.currency,
        isOpen: restaurant.isOpen,
      }}
      categories={restaurant.categories.map((category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
      }))}
      menuItems={restaurant.menuItems.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        imageUrl: item.imageUrl,
        optionGroupsJson: item.optionGroupsJson,
        isSoldOut: item.isSoldOut,
      }))}
      analytics={{
        totalOrders,
        completedOrders,
        canceledOrders,
        averageOrderValueCents: Math.round(average._avg.totalCents ?? 0),
        bestSellers: orderItems.map((item) => ({
          name: item.name,
          quantity: item._sum.quantity ?? 0,
        })),
      }}
      qrBaseUrl={process.env.ORDERKO_QR_BASE_URL ?? null}
    />
  );
}
