import { notFound } from "next/navigation";
import { getRestaurantMenuData } from "@/lib/restaurant-menu-data";
import { CustomerMenu } from "@/components/customer-menu";

export const dynamic = "force-dynamic";

export default async function KioskMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const menuData = await getRestaurantMenuData(slug);

  if (!menuData) notFound();

  return <CustomerMenu data={menuData} mode="kiosk" />;
}
