import { requireRole } from "@/lib/auth";
import { StaffOrders } from "@/components/staff-orders";

export default async function CashierPage() {
  await requireRole(["cashier", "admin"]);
  return <StaffOrders mode="cashier" />;
}
