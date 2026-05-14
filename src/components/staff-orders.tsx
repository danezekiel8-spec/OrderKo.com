"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import { Button, EmptyState, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { canTransition, minutesSince, statusLabels } from "@/lib/order-state";
import type { StaffOrderDto } from "@/types/orderko";
import { LogoutButton } from "@/components/logout-button";
import { OrderKoBrand } from "@/components/orderko-brand";
import { StaffInstallButton } from "@/components/staff-install-button";

type Mode = "cashier" | "kitchen";

const kitchenActions: { status: OrderStatus; label: string }[] = [
  { status: "PREPARING", label: "Preparing" },
  { status: "ALMOST_READY", label: "Almost Ready" },
  { status: "READY_FOR_PICKUP", label: "Ready" },
  { status: "COMPLETED", label: "Completed" },
];

export function StaffOrders({ mode, restaurantName }: { mode: Mode; restaurantName?: string }) {
  const [orders, setOrders] = useState<StaffOrderDto[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [connection, setConnection] = useState<"live" | "retrying" | "offline">("live");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => orders, [orders]);
  const actionsDisabled = connection !== "live";

  async function load() {
    if (!navigator.onLine) {
      setConnection("offline");
      setError("This device is offline. Existing orders stay visible; actions are paused until reconnect.");
      return;
    }
    try {
      const response = await fetch(`/api/staff/orders?view=${mode}&q=${encodeURIComponent(query)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { orders: StaffOrderDto[] };
      setOrders(data.orders);
      setError("");
      setConnection("live");
      setLastUpdated(new Date());
    } catch {
      setConnection(navigator.onLine ? "retrying" : "offline");
      setError("Could not refresh orders. Retrying automatically.");
    }
  }

  useEffect(() => {
    // Polling is the MVP realtime fallback; load performs async state updates after fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = window.setInterval(load, mode === "kitchen" ? 3500 : 5000);
    function markOffline() {
      setConnection("offline");
      setError("This device is offline. Existing orders stay visible; actions are paused until reconnect.");
    }
    window.addEventListener("online", load);
    window.addEventListener("offline", markOffline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", load);
      window.removeEventListener("offline", markOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, query]);

  function mutateOrder(orderId: string, payload: Record<string, unknown>) {
    if (actionsDisabled) {
      setError("Reconnect before updating orders. Visible orders may be stale.");
      return;
    }
    setPendingId(orderId);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/staff/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "Action failed.");
        }
        await load();
      } catch {
        setError("Connection dropped. Please try again.");
      } finally {
        setPendingId("");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-5 text-[#16211f]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#dbe4df] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <OrderKoBrand label="OrderKo staff" />
            <h1 className="mt-2 text-3xl font-semibold">{mode === "cashier" ? "Cashier dashboard" : "Kitchen queue"}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "cashier" ? "Confirm counter payments before kitchen work starts." : "Paid orders only, oldest first."}
            </p>
            {restaurantName ? <p className="mt-1 text-sm font-semibold text-teal-800">{restaurantName}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge tone={connection === "live" ? "good" : connection === "offline" ? "danger" : "warn"}>
                {connection === "live" ? "Live" : connection === "offline" ? "Offline" : "Reconnecting"}
              </Badge>
              {lastUpdated ? <span>Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <StaffInstallButton />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 rounded-lg border border-slate-300 px-3"
              placeholder="Search order #"
            />
            <Button variant="secondary" disabled={isPending} onClick={load}>Refresh</Button>
            <LogoutButton />
          </div>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}
        <div className={`mt-5 grid gap-4 ${mode === "kitchen" ? "xl:grid-cols-3" : "lg:grid-cols-2"}`}>
          {filtered.length ? (
            filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                mode={mode}
                busy={isPending && pendingId === order.id}
                disabled={actionsDisabled}
                onAction={(payload) => mutateOrder(order.id, payload)}
              />
            ))
          ) : (
            <div className="lg:col-span-2 xl:col-span-3">
              <EmptyState
                title={mode === "cashier" ? "No active counter orders" : "No paid kitchen orders"}
                body={mode === "cashier" ? "New customer orders will appear here automatically." : "Orders appear here only after cashier marks them paid."}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function OrderCard({
  order,
  mode,
  busy,
  disabled,
  onAction,
}: {
  order: StaffOrderDto;
  mode: Mode;
  busy: boolean;
  disabled: boolean;
  onAction: (payload: Record<string, unknown>) => void;
}) {
  const delayed = minutesSince(order.createdAt) >= 12 && !["READY_FOR_PICKUP", "COMPLETED"].includes(order.status);
  return (
    <article className={`rounded-lg border bg-white p-5 shadow-sm ${delayed ? "border-amber-400" : "border-[#dbe4df]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold">#{order.orderNumber}</p>
          <p className="mt-1 text-sm text-slate-500">{order.orderCode} · {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge tone={order.paymentStatus === "PAID" ? "good" : "warn"}>{order.paymentStatus}</Badge>
          {delayed ? <Badge tone="warn">{minutesSince(order.createdAt)} min</Badge> : null}
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-sm font-semibold">{statusLabels[order.status]}</p>
        {order.customerName ? <p className="mt-1 text-sm text-slate-500">Name: {order.customerName}</p> : null}
        {order.customerNote ? <p className="mt-1 text-sm text-slate-500">Order note: {order.customerNote}</p> : null}
      </div>
      <div className="mt-4 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="border-b border-slate-100 pb-3">
            <p className="text-lg font-semibold">{item.quantity}× {item.name}</p>
            {item.selectedOptions.length ? <p className="mt-1 text-sm text-slate-500">{item.selectedOptions.map((option) => option.optionName).join(", ")}</p> : null}
            {item.note ? <p className="mt-1 text-sm text-slate-500">Item note: {item.note}</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-xl font-semibold">{formatMoney(order.totalCents, order.restaurant.currency)}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {mode === "cashier" ? (
          <>
            <Button disabled={disabled || busy || order.paymentStatus === "PAID"} onClick={() => onAction({ action: "markPaid" })}>Mark Paid</Button>
            <Button variant="danger" disabled={disabled || busy || order.status !== "AWAITING_PAYMENT"} onClick={() => onAction({ action: "cancel" })}>Cancel</Button>
          </>
        ) : (
          kitchenActions.map((action) => (
            <Button
              key={action.status}
              variant={action.status === "COMPLETED" ? "secondary" : "primary"}
              disabled={disabled || busy || order.status === action.status || !canTransition(order.status, action.status)}
              onClick={() => onAction({ action: "setStatus", status: action.status })}
            >
              {action.label}
            </Button>
          ))
        )}
      </div>
    </article>
  );
}
