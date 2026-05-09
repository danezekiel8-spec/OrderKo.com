"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

type StaffRole = "cashier" | "kitchen" | "admin";

const roles: { value: StaffRole; label: string; hint: string }[] = [
  { value: "cashier", label: "Cashier", hint: "Mark paid and manage counter flow." },
  { value: "kitchen", label: "Kitchen", hint: "Progress paid orders." },
  { value: "admin", label: "Admin", hint: "Manage menu and analytics." },
];

function safeNextPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function StaffLogin() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<StaffRole>("cashier");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function login() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, pin }),
      });
      if (!response.ok) {
        setError("Invalid PIN for this role.");
        return;
      }
      const fallback = role === "admin" ? "/admin" : `/staff/${role}`;
      const next = safeNextPath(searchParams.get("next"), fallback);
      window.location.assign(next);
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f5] px-4">
      <section className="w-full max-w-md rounded-lg border border-[#dbe4df] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">OrderKo.com</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Staff sign in</h1>
        <div className="mt-6 grid gap-2">
          {roles.map((item) => (
            <button
              key={item.value}
              onClick={() => setRole(item.value)}
              className={`rounded-lg border p-4 text-left ${
                role === item.value ? "border-teal-600 bg-teal-50" : "border-slate-200 bg-white"
              }`}
            >
              <span className="font-semibold">{item.label}</span>
              <span className="mt-1 block text-sm text-slate-500">{item.hint}</span>
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-semibold">
          PIN
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") login();
            }}
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-lg"
            inputMode="numeric"
            type="password"
            autoFocus
          />
        </label>
        {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={pending || pin.length === 0} onClick={login}>
          {pending ? "Checking..." : "Sign in"}
        </Button>
      </section>
    </main>
  );
}
