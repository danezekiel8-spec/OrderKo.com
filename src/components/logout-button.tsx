"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";

export function LogoutButton({ label = "Logout" }: { label?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.assign("/staff/login");
        });
      }}
    >
      {pending ? "Logging out..." : label}
    </Button>
  );
}
