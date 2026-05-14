"use client";

import { useState, type FormEvent } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function LandingLeadForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      restaurantName: String(data.get("restaurantName") || ""),
      phone: String(data.get("phone") || ""),
      message: String(data.get("message") || ""),
      companyWebsite: String(data.get("companyWebsite") || ""),
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Could not submit the request.");
      }

      form.reset();
      setState("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit the request.");
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div className="hidden">
        <label htmlFor="companyWebsite">Company website</label>
        <input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-[#21322f]">
          Your name
          <input
            required
            name="name"
            autoComplete="name"
            className="min-h-12 rounded-xl border border-[#d9e1dc] bg-white px-4 text-base font-medium outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#21322f]">
          Work email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="min-h-12 rounded-xl border border-[#d9e1dc] bg-white px-4 text-base font-medium outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-[#21322f]">
          Restaurant name
          <input
            required
            name="restaurantName"
            autoComplete="organization"
            className="min-h-12 rounded-xl border border-[#d9e1dc] bg-white px-4 text-base font-medium outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#21322f]">
          Phone or Messenger
          <input
            name="phone"
            autoComplete="tel"
            className="min-h-12 rounded-xl border border-[#d9e1dc] bg-white px-4 text-base font-medium outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-[#21322f]">
        What kind of shop are you running?
        <textarea
          name="message"
          rows={4}
          className="rounded-xl border border-[#d9e1dc] bg-white px-4 py-3 text-base font-medium outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
          placeholder="Cafe, milk tea store, food stall, takeaway counter..."
        />
      </label>
      {state === "success" ? (
        <div className="rounded-xl border border-[#b7e4d7] bg-[#edfbf7] px-4 py-3 text-sm font-semibold text-[#0f766e]">
          Request received. We will contact you with the next setup step.
        </div>
      ) : null}
      {state === "error" ? (
        <div className="rounded-xl border border-[#ffd0d0] bg-[#fff0f0] px-4 py-3 text-sm font-semibold text-[#b42318]">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={state === "submitting"}
        className="min-h-14 rounded-full bg-[#0f766e] px-6 text-base font-bold text-white shadow-lg shadow-[#0f766e]/20 transition hover:bg-[#0d5f59] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "submitting" ? "Sending..." : "Request a demo"}
      </button>
    </form>
  );
}
