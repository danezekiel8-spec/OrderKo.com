"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

export function SuperAdminLogin() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function login() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/super-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Could not sign in.");
        return;
      }
      window.location.assign("/super-admin");
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f5] px-4">
      <section className="w-full max-w-md rounded-lg border border-[#dbe4df] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">OrderKo.com</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Super admin</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Create and onboard restaurant tenants.</p>
        <label className="mt-6 block text-sm font-semibold">
          Super-admin secret
          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") login();
            }}
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-lg"
            type="password"
            autoFocus
          />
        </label>
        {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        <Button className="mt-5 w-full" disabled={pending || secret.length === 0} onClick={login}>
          {pending ? "Checking..." : "Sign in"}
        </Button>
      </section>
    </main>
  );
}
