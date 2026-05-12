"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { customerStatuses, statusLabels } from "@/lib/order-state";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui";
import type { SelectedOptionDto } from "@/types/orderko";

type OrderStatusResponse = {
  order: {
    orderCode: string;
    orderNumber: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    customerName: string | null;
    customerNote: string | null;
    totalCents: number;
    createdAt: string;
    updatedAt: string;
    restaurant: { name: string; slug: string; currency: string };
    items: {
      id: string;
      name: string;
      quantity: number;
      note: string | null;
      selectedOptions: SelectedOptionDto[];
      lineTotalCents: number;
    }[];
    events: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
  };
};

const terminalStatuses: OrderStatus[] = ["COMPLETED", "CANCELED"];

function isTerminalStatus(status: OrderStatus) {
  return terminalStatuses.includes(status);
}

function formatClock(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OrderStatusClient({
  initialOrder,
  accessToken,
  mode = "customer",
}: {
  initialOrder: OrderStatusResponse["order"];
  accessToken: string;
  mode?: "customer" | "kiosk";
}) {
  const router = useRouter();
  const isKiosk = mode === "kiosk";
  const [order, setOrder] = useState(initialOrder);
  const [connection, setConnection] = useState<"live" | "retrying" | "offline" | "done">(
    isTerminalStatus(initialOrder.status) ? "done" : "live",
  );
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [kioskReturnSeconds, setKioskReturnSeconds] = useState(20);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let retryDelay = 5000;

    function schedule(delay: number) {
      if (stopped) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, delay);
    }

    async function refresh() {
      if (!navigator.onLine) {
        setConnection("offline");
        schedule(8000);
        return;
      }

      try {
        const response = await fetch(`/api/orders/${initialOrder.orderCode}?t=${encodeURIComponent(accessToken)}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed");
        const data = (await response.json()) as OrderStatusResponse;
        if (!stopped) {
          setOrder(data.order);
          setLastRefresh(new Date());
          setConnection(isTerminalStatus(data.order.status) ? "done" : "live");
          retryDelay = 5000;
          schedule(isTerminalStatus(data.order.status) ? 30000 : document.hidden ? 12000 : 5000);
        }
      } catch {
        if (!stopped) {
          setConnection(navigator.onLine ? "retrying" : "offline");
          retryDelay = Math.min(15000, Math.round(retryDelay * 1.5));
          schedule(retryDelay);
        }
      }
    }

    function refreshWhenVisible() {
      if (!document.hidden) void refresh();
    }

    function refreshWhenOnline() {
      void refresh();
    }

    function markOffline() {
      setConnection("offline");
    }

    void refresh();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("online", refreshWhenOnline);
    window.addEventListener("offline", markOffline);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("online", refreshWhenOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, [accessToken, initialOrder.orderCode]);

  useEffect(() => {
    if (!isKiosk || order.status !== "COMPLETED") {
      return;
    }

    const countdown = window.setInterval(() => {
      setKioskReturnSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    const returnTimer = window.setTimeout(() => {
      router.replace(`/k/${order.restaurant.slug}`);
    }, 20000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(returnTimer);
    };
  }, [isKiosk, order.restaurant.slug, order.status, router]);

  const activeIndex = customerStatuses.includes(order.status)
    ? customerStatuses.indexOf(order.status)
    : -1;
  const eventByStatus = useMemo(
    () => new Map(order.events.map((event) => [event.status, event])),
    [order.events],
  );
  const connectionCopy = {
    live: "Live updates",
    retrying: "Reconnecting",
    offline: "Offline",
    done: "Finished",
  }[connection];
  const connectionTone = connection === "live" || connection === "done" ? "good" : connection === "offline" ? "danger" : "warn";
  const currentStatusCopy =
    order.status === "AWAITING_PAYMENT"
      ? "Show this order number at the counter and pay so the kitchen can start."
      : order.status === "PAYMENT_CONFIRMED"
        ? "Payment is confirmed. Your order is now waiting in the kitchen queue."
        : order.status === "PREPARING"
          ? "The kitchen is preparing your order. Stay nearby and keep this page open."
          : order.status === "ALMOST_READY"
            ? "Your order is almost ready. Please stay near the pickup counter."
            : order.status === "READY_FOR_PICKUP"
              ? "Your order is ready for pickup. Please collect it at the counter."
              : order.status === "COMPLETED"
                ? "This order is complete. Thanks for ordering."
                : "This order was canceled. Please speak with staff if this looks wrong.";
  const readyForPickup = order.status === "READY_FOR_PICKUP";
  const canceled = order.status === "CANCELED";
  const completed = order.status === "COMPLETED";
  const returnHref = isKiosk ? `/k/${order.restaurant.slug}` : `/r/${order.restaurant.slug}`;

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] text-[#182522] sm:px-4 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pt-[calc(1rem+env(safe-area-inset-top))]">
      <section className="mx-auto max-w-2xl space-y-3 sm:space-y-4">
        <div className={`overflow-hidden rounded-2xl border shadow-[0_16px_42px_rgba(28,39,35,0.1)] sm:rounded-[1.35rem] sm:shadow-[0_22px_70px_rgba(28,39,35,0.12)] ${
          readyForPickup ? "border-teal-200 bg-teal-700 text-white" : canceled ? "border-rose-200 bg-white" : "border-[#e0ddd4] bg-white"
        }`}>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${readyForPickup ? "text-teal-100" : "text-teal-700"}`}>
                  OrderKo.com
                </p>
                <h1 className="mt-2 text-4xl font-semibold leading-none sm:mt-3 sm:text-5xl">#{order.orderNumber}</h1>
                <p className={`mt-2 break-words text-xs leading-5 sm:mt-3 sm:text-sm sm:leading-6 ${readyForPickup ? "text-teal-50" : "text-[#65756f]"}`}>
                  {order.restaurant.name} · {order.orderCode}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <Badge tone={connectionTone}>{connectionCopy}</Badge>
                {lastRefresh ? (
                  <p className={`text-xs ${readyForPickup ? "text-teal-50" : "text-[#65756f]"}`}>Updated {formatClock(lastRefresh)}</p>
                ) : null}
              </div>
            </div>

            <div className={`mt-4 rounded-xl p-3 sm:mt-6 sm:rounded-2xl sm:p-4 ${readyForPickup ? "bg-white text-[#182522]" : "bg-[#eef8f5]"}`}>
              <p className="text-sm font-semibold text-teal-900">Current status</p>
              <p className="mt-1 text-xl font-semibold text-teal-950 sm:text-2xl">{statusLabels[order.status]}</p>
              <p className="mt-1.5 text-sm leading-6 text-teal-900 sm:mt-2">{currentStatusCopy}</p>
              {connection === "retrying" || connection === "offline" ? (
                <p className="mt-3 rounded-xl bg-white/80 p-3 text-sm leading-6 text-teal-950">
                  Updates are paused while the connection recovers. Keep this page open; it will retry automatically.
                </p>
              ) : null}
              {completed ? (
                <Link
                  href={returnHref}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#8a5a2b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#70451f]"
                >
                  {isKiosk ? `Start next order${kioskReturnSeconds ? ` (${kioskReturnSeconds})` : ""}` : "Close order and return to menu"}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {order.status !== "CANCELED" ? (
          <div className="rounded-2xl border border-[#e0ddd4] bg-white p-4 shadow-[0_10px_30px_rgba(28,39,35,0.07)] sm:rounded-[1.35rem] sm:p-5 sm:shadow-[0_14px_42px_rgba(28,39,35,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold sm:text-lg">Order progress</h2>
              <span className="text-xs text-[#65756f] sm:text-sm">Oldest first</span>
            </div>
            <ol className="mt-4 space-y-0 sm:mt-5 sm:space-y-1">
              {customerStatuses.map((status, index) => {
                const event = eventByStatus.get(status);
                const done = index <= activeIndex;
                const current = index === activeIndex;
                return (
                  <li key={status} className="grid grid-cols-[1.75rem_1fr] gap-2.5 sm:grid-cols-[2rem_1fr] sm:gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid size-7 place-items-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm ${
                          done ? "bg-teal-700 text-white" : "bg-[#f0ede6] text-[#8a948f]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      {index < customerStatuses.length - 1 ? (
                        <span className={`h-6 w-px sm:h-8 ${index < activeIndex ? "bg-teal-600" : "bg-[#e2ded4]"}`} />
                      ) : null}
                    </div>
                    <div className="pb-3 sm:pb-4">
                      <p className={`text-sm font-semibold sm:text-base ${done ? "text-[#182522]" : "text-[#8a948f]"}`}>{statusLabels[status]}</p>
                      <p className="mt-0.5 text-xs leading-5 text-[#65756f] sm:mt-1 sm:text-sm">
                        {event ? formatClock(event.createdAt) : current ? "In progress now" : "Waiting"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[#e0ddd4] bg-white p-4 shadow-[0_10px_30px_rgba(28,39,35,0.07)] sm:rounded-[1.35rem] sm:p-5 sm:shadow-[0_14px_42px_rgba(28,39,35,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold sm:text-lg">Order details</h2>
              <p className="mt-1 text-xs leading-5 text-[#65756f] sm:text-sm">Use this summary if staff needs to confirm the order.</p>
            </div>
            <span className="rounded-full bg-[#eef8f5] px-3 py-1 text-xs font-semibold text-teal-800">{order.paymentStatus.replace("_", " ")}</span>
          </div>
          <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#eee9df] bg-[#fbfaf7] p-2.5 sm:rounded-2xl sm:p-3">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.quantity}x {item.name}</p>
                    {item.selectedOptions.length ? (
                      <p className="mt-1 text-sm leading-5 text-[#65756f]">
                        {item.selectedOptions.map((option) => option.optionName).join(", ")}
                      </p>
                    ) : null}
                    {item.note ? <p className="mt-1 text-sm leading-5 text-[#65756f]">Note: {item.note}</p> : null}
                  </div>
                  <p className="shrink-0 font-semibold">{formatMoney(item.lineTotalCents, order.restaurant.currency)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-[#d7b98a] p-3 text-[#2f2418] sm:mt-4 sm:rounded-2xl sm:p-4">
            <div className="flex justify-between gap-3 text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.totalCents, order.restaurant.currency)}</span>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-[#5c432a] sm:mt-2 sm:text-sm">Payment is handled at the counter for this pilot.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
