import { requireRole } from "@/lib/auth";
import { StaffOrders } from "@/components/staff-orders";

export default async function KitchenPage() {
  const session = await requireRole(["kitchen", "admin"]);
  return <StaffOrders mode="kitchen" restaurantName={session.restaurantName} />;
}
