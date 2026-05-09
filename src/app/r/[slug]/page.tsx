import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseOptionGroups } from "@/lib/menu";
import { CustomerMenu } from "@/components/customer-menu";

export const dynamic = "force-dynamic";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  if (!restaurant) notFound();

  return (
    <CustomerMenu
      data={{
        restaurant: {
          id: restaurant.id,
          slug: restaurant.slug,
          name: restaurant.name,
          description: restaurant.description,
          address: restaurant.address,
          currency: restaurant.currency,
          isOpen: restaurant.isOpen,
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
      }}
    />
  );
}
