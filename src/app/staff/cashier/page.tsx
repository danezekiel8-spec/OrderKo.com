import { requireRole } from "@/lib/auth";
import { StaffOrders } from "@/components/staff-orders";

export default async function CashierPage() {
  const session = await requireRole(["cashier", "admin"]);
  return <StaffOrders mode="cashier" restaurantName={session.restaurantName} />;
}
