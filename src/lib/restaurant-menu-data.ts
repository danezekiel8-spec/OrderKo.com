import { prisma } from "@/lib/prisma";
import { parseOptionGroups } from "@/lib/menu";
import type { MenuResponse } from "@/types/orderko";

export async function getRestaurantMenuData(slug: string): Promise<MenuResponse | null> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          menuItems: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });

  if (!restaurant) return null;

  return {
    restaurant: {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      currency: restaurant.currency,
      isOpen: restaurant.isOpen,
      isServiceActive: restaurant.isServiceActive,
      isKioskEnabled: restaurant.isKioskEnabled,
    },
    categories: restaurant.categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: category.menuItems.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        imageUrl: item.imageUrl,
        isSoldOut: item.isSoldOut,
        optionGroups: parseOptionGroups(item.optionGroupsJson),
      })),
    })),
  };
}
