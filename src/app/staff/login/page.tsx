import { Suspense } from "react";
import { StaffLogin } from "@/components/staff-login";

export default function StaffLoginPage() {
  return (
    <Suspense>
      <StaffLogin />
    </Suspense>
  );
}
