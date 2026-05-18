"use client";

import { useState } from "react";

const plans = [
  {
    name: "Starter",
    label: "For first pilots",
    description: "QR menu, ordering, cashier, kitchen, and admin tools.",
    price: "$39",
    priceNote: "per month",
    items: ["Public QR ordering", "Counter payment workflow", "Menu and sold-out controls"],
  },
  {
    name: "Growth",
    label: "Recommended",
    description: "A stronger setup for busy cafes and takeaway counters.",
    price: "$59",
    priceNote: "per month",
    items: ["Everything in Starter", "Kiosk-ready ordering", "Setup support and launch guidance"],
    featured: true,
  },
  {
    name: "Pilot Setup",
    label: "For rollout help",
    description: "A practical launch plan for restaurants testing OrderKo live.",
    price: "Contact us",
    priceNote: "for pilot setup",
    items: ["QR signage guidance", "Staff onboarding notes", "Custom setup discussion"],
  },
];

export function LandingPricingPlans() {
  const [activePlan, setActivePlan] = useState("Growth");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => {
        const active = activePlan === plan.name;
        return (
          <button
            key={plan.name}
            type="button"
            aria-expanded={active}
            onClick={() => setActivePlan(plan.name)}
            className={`landing-hover-lift rounded-[1.35rem] border p-5 text-left backdrop-blur-xl transition-all duration-300 ease-out ${
              active
                ? "border-[#0f766e]/50 bg-[#edfbf7]/72 shadow-xl shadow-[#0f766e]/10"
                : "border-white/70 bg-white/54 shadow-xl shadow-[#10201d]/6"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">{plan.label}</p>
                <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
              </div>
              {plan.featured ? (
                <span className="rounded-full bg-[#0f766e] px-3 py-1 text-xs font-black text-white">Recommended</span>
              ) : null}
            </div>
            <p className="mt-4 min-h-14 leading-7 text-[#5f6c68]">{plan.description}</p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-black">{plan.price}</p>
                <p className="text-sm font-semibold text-[#5f6c68]">{plan.priceNote}</p>
              </div>
              <span className={`text-2xl font-black text-[#0f766e] transition-transform duration-300 ${active ? "rotate-45" : ""}`}>
                +
              </span>
            </div>
            <div
              className={`grid overflow-hidden transition-all duration-300 ease-out ${
                active ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 space-y-3">
                {plan.items.map((item) => (
                  <div key={item} className="flex gap-3 text-sm font-semibold text-[#21322f]">
                    <span className="text-[#0f766e]">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
