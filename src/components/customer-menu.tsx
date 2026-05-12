"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import type { MenuItemDto, MenuResponse, SelectedOptionDto } from "@/types/orderko";
import { Button, Badge } from "@/components/ui";

type CartItem = {
  key: string;
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  note: string;
  selectedOptions: SelectedOptionDto[];
};

type KioskConfirmation = {
  orderCode: string;
  orderNumber: number;
  trackingUrl: string;
  qrDataUrl: string;
  qrError: string;
};

const cartStoragePrefix = "orderko-cart:";
const kioskCartStoragePrefix = "orderko-kiosk-cart:";
const kioskWarningAfterMs = 90000;
const kioskResetAfterMs = 120000;
const kioskConfirmationResetMs = 30000;

function itemKey(itemId: string, selectedOptions: SelectedOptionDto[], note: string) {
  return `${itemId}:${JSON.stringify(selectedOptions)}:${note.trim()}`;
}

function cartCountLabel(count: number) {
  return `${count} item${count === 1 ? "" : "s"}`;
}

export function CustomerMenu({ data, mode = "customer" }: { data: MenuResponse; mode?: "customer" | "kiosk" }) {
  const router = useRouter();
  const isKiosk = mode === "kiosk";
  const cartStorageKey = `${isKiosk ? kioskCartStoragePrefix : cartStoragePrefix}${data.restaurant.slug}`;
  const [menuData, setMenuData] = useState(data);
  const [activeCategory, setActiveCategory] = useState(data.categories[0]?.id ?? "");
  const [selectedItem, setSelectedItem] = useState<MenuItemDto | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [error, setError] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kioskStarted, setKioskStarted] = useState(!isKiosk);
  const [kioskConfirmation, setKioskConfirmation] = useState<KioskConfirmation | null>(null);
  const [kioskConfirmationSeconds, setKioskConfirmationSeconds] = useState(kioskConfirmationResetMs / 1000);
  const [idleWarningVisible, setIdleWarningVisible] = useState(false);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState(30);
  const [isPending, startTransition] = useTransition();
  const submissionKeyRef = useRef<string | null>(null);

  const menuItemById = useMemo(
    () => new Map(menuData.categories.flatMap((category) => category.items).map((item) => [item.id, item])),
    [menuData.categories],
  );
  const totalCents = cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unavailableItemIds = useMemo(
    () =>
      cart
        .filter((cartItem) => {
          const menuItem = menuItemById.get(cartItem.menuItemId);
          return !menuItem || menuItem.isSoldOut;
        })
        .map((cartItem) => cartItem.menuItemId),
    [cart, menuItemById],
  );
  const hasBlockingUnavailableItem = unavailableItemIds.length > 0;
  const orderBusy = isPending || isSubmitting;
  const kioskTrackingUrl = kioskConfirmation?.trackingUrl ?? "";
  const hasActiveKioskSession = Boolean(
    kioskStarted || cart.length || customerName.trim() || customerNote.trim() || selectedItem || mobileCartOpen || error,
  );

  const readSavedCart = useCallback(
    (key: string) => {
      const storage = isKiosk ? window.sessionStorage : window.localStorage;
      return storage.getItem(key);
    },
    [isKiosk],
  );

  const removeSavedCart = useCallback(
    (key: string) => {
      const storage = isKiosk ? window.sessionStorage : window.localStorage;
      storage.removeItem(key);
    },
    [isKiosk],
  );

  const resetSession = useCallback(() => {
    setCart([]);
    setCustomerName("");
    setCustomerNote("");
    setError("");
    setSelectedItem(null);
    setMobileCartOpen(false);
    setKioskStarted(!isKiosk);
    setKioskConfirmation(null);
    setKioskConfirmationSeconds(kioskConfirmationResetMs / 1000);
    setIdleWarningVisible(false);
    setIdleSecondsRemaining(30);
    submissionKeyRef.current = null;
    try {
      removeSavedCart(cartStorageKey);
    } catch {
      // Kiosk reset still works even if browser storage is unavailable.
    }
  }, [cartStorageKey, isKiosk, removeSavedCart]);

  function normalizeCartItem(savedItem: CartItem) {
    const menuItem = menuItemById.get(savedItem.menuItemId);
    if (!menuItem) return savedItem;
    const selectedOptions = Array.isArray(savedItem.selectedOptions) ? savedItem.selectedOptions : [];
    const optionsTotal = selectedOptions.reduce((sum, option) => sum + option.priceCents, 0);
    return {
      ...savedItem,
      name: menuItem.name,
      quantity: Math.min(20, Math.max(1, Number(savedItem.quantity) || 1)),
      unitPriceCents: menuItem.priceCents + optionsTotal,
      note: savedItem.note ?? "",
      selectedOptions,
    };
  }

  function hasUnavailableItemsIn(cartItems: CartItem[], source: MenuResponse) {
    const itemsById = new Map(source.categories.flatMap((category) => category.items).map((item) => [item.id, item]));
    return cartItems.some((cartItem) => {
      const menuItem = itemsById.get(cartItem.menuItemId);
      return !menuItem || menuItem.isSoldOut;
    });
  }

  async function refreshMenuSnapshot() {
    const response = await fetch(`/api/restaurants/${data.restaurant.slug}/menu`, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not refresh menu");
    const latest = (await response.json()) as MenuResponse;
    setMenuData(latest);
    return latest;
  }

  useEffect(() => {
    let canceled = false;
    const timer = window.setTimeout(() => {
      try {
        if (isKiosk) {
          removeSavedCart(cartStorageKey);
          return;
        }
        const saved = readSavedCart(cartStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as {
            cart?: CartItem[];
            customerName?: string;
            customerNote?: string;
            submissionKey?: string | null;
          };
          if (!canceled) {
            setCart(Array.isArray(parsed.cart) ? parsed.cart.map((item) => normalizeCartItem(item)) : []);
            setCustomerName(parsed.customerName ?? "");
            setCustomerNote(parsed.customerNote ?? "");
            submissionKeyRef.current = parsed.submissionKey ?? null;
          }
        }
      } catch {
        removeSavedCart(cartStorageKey);
      } finally {
        if (!canceled) setCartLoaded(true);
      }
    }, 0);
    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
    // Restore once per restaurant slug; later menu refreshes should not overwrite the live cart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartStorageKey, isKiosk, readSavedCart, removeSavedCart]);

  useEffect(() => {
    if (!cartLoaded) return;
    if (isKiosk) return;
    try {
      window.localStorage.setItem(
        cartStorageKey,
        JSON.stringify({
          cart,
          customerName,
          customerNote,
          submissionKey: submissionKeyRef.current,
        }),
      );
    } catch {
      // Local storage is a convenience for refresh recovery; ordering still works without it.
    }
  }, [cart, cartLoaded, cartStorageKey, customerName, customerNote, isKiosk]);

  useEffect(() => {
    if (!isKiosk || !kioskTrackingUrl) return;
    let canceled = false;

    async function buildTrackingQr() {
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(kioskTrackingUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 260,
          color: {
            dark: "#13201d",
            light: "#ffffff",
          },
        });
        if (!canceled) {
          setKioskConfirmation((current) =>
            current && current.trackingUrl === kioskTrackingUrl ? { ...current, qrDataUrl: dataUrl, qrError: "" } : current,
          );
        }
      } catch {
        if (!canceled) {
          setKioskConfirmation((current) =>
            current && current.trackingUrl === kioskTrackingUrl
              ? { ...current, qrError: "Tracking QR could not be generated. Use the order number at the counter." }
              : current,
          );
        }
      }
    }

    void buildTrackingQr();
    return () => {
      canceled = true;
    };
  }, [isKiosk, kioskTrackingUrl]);

  useEffect(() => {
    if (!isKiosk || !kioskConfirmation) return;

    const countdown = window.setInterval(() => {
      setKioskConfirmationSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    const resetTimer = window.setTimeout(resetSession, kioskConfirmationResetMs);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(resetTimer);
    };
  }, [isKiosk, kioskConfirmation, resetSession]);

  useEffect(() => {
    if (!isKiosk || !hasActiveKioskSession || orderBusy) {
      return;
    }

    let countdown: number | undefined;
    let warningTimer: number | undefined;
    let resetTimer: number | undefined;

    function clearTimers() {
      window.clearTimeout(warningTimer);
      window.clearTimeout(resetTimer);
      window.clearInterval(countdown);
    }

    function scheduleReset({ hideWarning = false }: { hideWarning?: boolean } = {}) {
      clearTimers();
      if (hideWarning) {
        setIdleWarningVisible(false);
        setIdleSecondsRemaining(30);
      }
      warningTimer = window.setTimeout(() => {
        setIdleWarningVisible(true);
        setIdleSecondsRemaining(30);
        countdown = window.setInterval(() => {
          setIdleSecondsRemaining((seconds) => Math.max(0, seconds - 1));
        }, 1000);
      }, kioskWarningAfterMs);
      resetTimer = window.setTimeout(resetSession, kioskResetAfterMs);
    }

    scheduleReset();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => scheduleReset({ hideWarning: true });
    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));

    return () => {
      clearTimers();
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
    };
  }, [hasActiveKioskSession, isKiosk, orderBusy, resetSession]);

  useEffect(() => {
    const locked = Boolean(selectedItem || mobileCartOpen);
    document.body.classList.toggle("overflow-hidden", locked);
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileCartOpen, selectedItem]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSelectedItem(null);
      setMobileCartOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function addToCart(item: CartItem) {
    setError("");
    submissionKeyRef.current = null;
    setCart((current) => {
      const existing = current.find((candidate) => candidate.key === item.key);
      if (existing) {
        return current.map((candidate) =>
          candidate.key === item.key
            ? { ...candidate, quantity: Math.min(20, candidate.quantity + item.quantity) }
            : candidate,
        );
      }
      return [...current, item];
    });
  }

  async function placeOrder() {
    if (!cart.length || orderBusy || hasBlockingUnavailableItem || !menuData.restaurant.isOpen) return;
    setError("");
    const submissionKey =
      submissionKeyRef.current ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;
    submissionKeyRef.current = submissionKey;
    const payload = {
      submissionKey,
      customerName,
      customerNote,
      items: cart.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note,
        selectedOptions: item.selectedOptions,
      })),
    };

    startTransition(async () => {
      setIsSubmitting(true);
      try {
        const latestMenu = await refreshMenuSnapshot().catch(() => null);
        if (latestMenu && !latestMenu.restaurant.isOpen) {
          setError(`${latestMenu.restaurant.name} is currently closed for ordering. You can still browse the menu.`);
          return;
        }
        if (latestMenu && hasUnavailableItemsIn(cart, latestMenu)) {
          setError("One or more cart items are no longer available. Remove the marked items before placing the order.");
          return;
        }
        const response = await fetch(`/api/restaurants/${data.restaurant.slug}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as {
          order?: { orderCode: string; orderNumber: number; customerAccessToken?: string | null };
          error?: string;
        };
        if (!response.ok || !result.order) {
          setError(result.error ?? "Order could not be placed. Please try again.");
          if (response.status === 409) await refreshMenuSnapshot().catch(() => null);
          return;
        }
        setCart([]);
        setCustomerName("");
        setCustomerNote("");
        submissionKeyRef.current = null;
        removeSavedCart(cartStorageKey);
        const tokenParam = result.order.customerAccessToken ? `?t=${encodeURIComponent(result.order.customerAccessToken)}` : "";
        const trackingPath = `/order/${result.order.orderCode}${tokenParam}`;
        if (isKiosk) {
          setSelectedItem(null);
          setMobileCartOpen(false);
          setError("");
          setKioskStarted(false);
          setKioskConfirmationSeconds(kioskConfirmationResetMs / 1000);
          setKioskConfirmation({
            orderCode: result.order.orderCode,
            orderNumber: result.order.orderNumber,
            trackingUrl: `${window.location.origin}${trackingPath}`,
            qrDataUrl: "",
            qrError: "",
          });
          return;
        }
        router.push(trackingPath);
      } catch {
        setError("Connection dropped while placing the order. Your cart is still saved. Please retry once, then check with the counter before trying again.");
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  if (isKiosk && kioskConfirmation) {
    return (
      <KioskConfirmationScreen
        confirmation={kioskConfirmation}
        secondsRemaining={kioskConfirmationSeconds}
        onNewOrder={resetSession}
      />
    );
  }

  if (isKiosk && !kioskStarted) {
    return (
      <KioskStartScreen
        restaurant={menuData.restaurant}
        onStart={() => {
          setKioskStarted(true);
          setKioskConfirmation(null);
          setKioskConfirmationSeconds(kioskConfirmationResetMs / 1000);
        }}
      />
    );
  }

  return (
    <main className={`min-h-screen bg-[#f7f4ed] text-[#182522] ${isKiosk ? "pb-8" : "pb-[calc(7.25rem+env(safe-area-inset-bottom))] lg:pb-10"}`}>
      <header className={`sticky top-0 z-20 border-b border-[#e0ddd4] bg-[#f7f4ed]/94 backdrop-blur-xl ${isKiosk ? "px-6 py-4" : "px-3 pt-[calc(0.55rem+env(safe-area-inset-top))] sm:px-4 sm:pt-[calc(0.75rem+env(safe-area-inset-top))]"}`}>
        <div className={isKiosk ? "mx-auto max-w-[1500px]" : "mx-auto max-w-6xl"}>
          <div className="flex items-center justify-between gap-3 pb-2 sm:pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">OrderKo.com</p>
              {isKiosk ? <p className="mt-1 text-sm font-semibold text-[#65756f]">Kiosk ordering</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {isKiosk && hasActiveKioskSession ? (
                <button
                  className="min-h-12 rounded-full border border-[#d9d4ca] bg-white px-5 text-base font-semibold text-[#182522] shadow-sm transition active:scale-[0.98]"
                  onClick={resetSession}
                >
                  Start over
                </button>
              ) : null}
              <Badge tone={menuData.restaurant.isOpen ? "good" : "danger"}>
                {menuData.restaurant.isOpen ? "Open now" : "Closed"}
              </Badge>
            </div>
          </div>
          <div className="relative -mx-3 sm:-mx-4">
            <div className="flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:px-4 sm:pb-3 [&::-webkit-scrollbar]:hidden">
              {menuData.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    document.getElementById(category.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`${isKiosk ? "min-h-14 px-6 text-lg" : "min-h-10 px-3 text-sm sm:min-h-11 sm:px-4"} shrink-0 rounded-full font-semibold shadow-sm transition active:scale-[0.98] ${
                    activeCategory === category.id
                      ? "bg-[#17211f] text-white"
                      : "border border-[#e3dfd5] bg-white/85 text-[#485953]"
                  }`}
                >
                  {category.name}
                  <span className="ml-2 text-xs opacity-70">{category.items.length}</span>
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#f7f4ed] to-transparent" />
          </div>
        </div>
      </header>

      <section className={`${isKiosk ? "mx-auto grid max-w-[1500px] gap-6 px-6 py-6 xl:grid-cols-[1fr_430px]" : "mx-auto grid max-w-6xl gap-5 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[1fr_372px] lg:gap-6 lg:py-6"}`}>
        <div className="min-w-0 space-y-5 sm:space-y-7">
          <section className="overflow-hidden rounded-2xl border border-[#e0ddd4] bg-[#13201d] text-white shadow-[0_16px_42px_rgba(19,32,29,0.14)] sm:rounded-[1.35rem] sm:shadow-[0_22px_70px_rgba(19,32,29,0.18)]">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">{isKiosk ? "Tap, order, pay at cashier" : "Scan, order, pay"}</p>
                  <h1 className={`mt-2 font-semibold leading-tight sm:mt-3 ${isKiosk ? "text-5xl" : "text-2xl sm:text-4xl"}`}>{menuData.restaurant.name}</h1>
                  <p className={`mt-2 line-clamp-2 max-w-2xl text-[#d7e4de] sm:mt-3 sm:line-clamp-none ${isKiosk ? "text-xl leading-8" : "text-sm leading-5 sm:leading-6"}`}>{menuData.restaurant.description}</p>
                  <p className={`mt-2 line-clamp-1 max-w-2xl text-[#aebdb7] sm:mt-3 ${isKiosk ? "text-base leading-6" : "text-xs leading-5 sm:text-sm sm:leading-6"}`}>{menuData.restaurant.address}</p>
                </div>
                <div className="hidden min-w-28 rounded-2xl border border-white/12 bg-white/10 p-3 text-center sm:grid">
                  <span className="text-xs font-semibold uppercase text-[#bdd9d2]">Cart</span>
                  <span className="mt-1 text-2xl font-semibold">{count}</span>
                  <span className="text-xs text-[#bdd9d2]">items</span>
                </div>
              </div>
              {!menuData.restaurant.isOpen ? (
                <p className="mt-5 rounded-2xl bg-rose-100 p-4 text-sm leading-6 text-rose-800">
                  {menuData.restaurant.name} is currently closed for ordering. You can still browse the menu.
                </p>
              ) : (
                <div className={`mt-5 hidden gap-2 sm:grid sm:grid-cols-3 ${isKiosk ? "text-lg" : "text-sm"}`}>
                  <div className="rounded-2xl bg-white/10 p-3 text-[#edf7f3]">No app needed</div>
                  <div className="rounded-2xl bg-white/10 p-3 text-[#edf7f3]">Order number</div>
                  <div className="rounded-2xl bg-white/10 p-3 text-[#edf7f3]">Pay at counter</div>
                </div>
              )}
            </div>
          </section>

          {menuData.categories.length ? (
            menuData.categories.map((category) => (
              <section key={category.id} id={category.id} className="scroll-mt-28 sm:scroll-mt-32">
                <div className="mb-2 flex items-end justify-between gap-3 sm:mb-3">
                  <div>
                    <h2 className={`font-semibold leading-tight ${isKiosk ? "text-3xl" : "text-lg sm:text-xl"}`}>{category.name}</h2>
                    <p className={`mt-0.5 text-[#66756f] sm:mt-1 ${isKiosk ? "text-base" : "text-xs sm:text-sm"}`}>{category.items.length} menu items</p>
                  </div>
                </div>
                <div className={`grid gap-2.5 sm:gap-3 ${isKiosk ? "md:grid-cols-2 2xl:grid-cols-3" : "sm:grid-cols-2"}`}>
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      disabled={item.isSoldOut || !menuData.restaurant.isOpen}
                      aria-disabled={item.isSoldOut || !menuData.restaurant.isOpen}
                      onClick={() => setSelectedItem(item)}
                      className={`group overflow-hidden border border-[#e2ded4] bg-white text-left shadow-[0_8px_22px_rgba(28,39,35,0.05)] transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-[0_16px_38px_rgba(28,39,35,0.1)] active:scale-[0.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 ${isKiosk ? "min-h-44 rounded-3xl p-4" : "min-h-28 rounded-xl p-2.5 sm:min-h-36 sm:rounded-2xl sm:p-3 sm:shadow-[0_10px_30px_rgba(28,39,35,0.06)]"}`}
                    >
                      <div className={`flex h-full ${isKiosk ? "gap-4" : "gap-2.5 sm:gap-3"}`}>
                        <MenuImage src={item.imageUrl} className={isKiosk ? "h-36 w-36 shrink-0 rounded-2xl" : "h-24 w-24 shrink-0 rounded-lg sm:h-32 sm:w-32 sm:rounded-xl"} loading="lazy" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`min-w-0 font-semibold leading-snug text-[#182522] ${isKiosk ? "text-2xl" : "text-base"}`}>{item.name}</h3>
                            {item.isSoldOut ? <Badge tone="danger">Sold out</Badge> : null}
                          </div>
                          <p className={`mt-1 line-clamp-2 text-[#65756f] sm:mt-2 ${isKiosk ? "text-base leading-7" : "text-xs leading-5 sm:text-sm sm:leading-6"}`}>{item.description}</p>
                          <div className="mt-auto flex items-center justify-between gap-3 pt-2 sm:pt-3">
                            <p className={`font-semibold text-teal-800 ${isKiosk ? "text-xl" : ""}`}>{formatMoney(item.priceCents, menuData.restaurant.currency)}</p>
                            <span className={`grid shrink-0 place-items-center rounded-full bg-[#17211f] font-semibold text-white transition group-hover:bg-teal-700 ${isKiosk ? "size-14 text-2xl" : "size-9 text-lg sm:size-10"}`}>
                              +
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d6d0c4] bg-white p-6 text-center shadow-sm">
              <h2 className="text-lg font-semibold">Menu is being prepared</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Please check back shortly or ask the counter for today&apos;s available items.
              </p>
            </div>
          )}
        </div>

        <aside className={isKiosk ? "hidden xl:block" : "hidden lg:block"}>
          <div className="sticky top-32">
            <CartPanel
              mode={mode}
              cart={cart}
              currency={menuData.restaurant.currency}
              customerName={customerName}
              customerNote={customerNote}
              error={error}
              isPending={orderBusy}
              restaurantOpen={menuData.restaurant.isOpen}
              unavailableItemIds={unavailableItemIds}
              onNameChange={setCustomerName}
              onNoteChange={setCustomerNote}
              onPlaceOrder={placeOrder}
              onUpdateQuantity={(key, quantity) =>
                setCart((items) =>
                  quantity <= 0
                    ? items.filter((item) => item.key !== key)
                    : items.map((item) => (item.key === key ? { ...item, quantity: Math.min(20, quantity) } : item)),
                )
              }
            />
          </div>
        </aside>
      </section>

      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-[#ded8cc] bg-white/96 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_rgba(20,31,28,0.1)] backdrop-blur-xl sm:px-4 sm:pb-[calc(0.9rem+env(safe-area-inset-bottom))] sm:pt-3 ${isKiosk ? "xl:hidden" : "lg:hidden"}`}>
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[#65756f]">{cartLoaded ? cartCountLabel(count) : "Loading cart"}</p>
              <p className="hidden text-sm text-[#65756f] min-[420px]:block">Review before paying at counter</p>
            </div>
            <span className="text-lg font-semibold sm:text-xl">{formatMoney(totalCents, menuData.restaurant.currency)}</span>
          </div>
          <Button className="w-full rounded-xl" disabled={!cart.length || !cartLoaded} onClick={() => setMobileCartOpen(true)}>
            {cart.length ? "Review order" : "Cart is empty"}
          </Button>
        </div>
      </div>

      {mobileCartOpen ? (
        <div
          className="fixed inset-0 z-40 flex h-[100dvh] items-end bg-black/40 p-0 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Review order"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileCartOpen(false);
          }}
        >
          <div className="flex max-h-[90dvh] w-full animate-[sheetIn_180ms_ease-out] flex-col rounded-t-[1.25rem] bg-[#f7f4ed] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e1dbcf] px-3 py-2.5 sm:px-4 sm:py-3">
              <div>
                <h2 className="text-base font-semibold sm:text-lg">Review order</h2>
                <p className="text-xs text-[#65756f] sm:text-sm">Pay at the counter after placing it.</p>
              </div>
              <button
                className="grid size-11 place-items-center rounded-full bg-white text-xl shadow-sm"
                onClick={() => setMobileCartOpen(false)}
                aria-label="Close cart"
                autoFocus
              >
                x
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-4">
              <CartPanel
                mode={mode}
                cart={cart}
                currency={menuData.restaurant.currency}
                customerName={customerName}
                customerNote={customerNote}
                error={error}
                isPending={orderBusy}
                restaurantOpen={menuData.restaurant.isOpen}
                unavailableItemIds={unavailableItemIds}
                onNameChange={setCustomerName}
                onNoteChange={setCustomerNote}
                onPlaceOrder={placeOrder}
                onUpdateQuantity={(key, quantity) =>
                  setCart((items) =>
                    quantity <= 0
                      ? items.filter((item) => item.key !== key)
                      : items.map((item) => (item.key === key ? { ...item, quantity: Math.min(20, quantity) } : item)),
                  )
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {selectedItem ? (
        <ItemModal
          item={selectedItem}
          currency={menuData.restaurant.currency}
          mode={mode}
          onClose={() => setSelectedItem(null)}
          onAdd={(cartItem) => {
            addToCart(cartItem);
            setSelectedItem(null);
            setMobileCartOpen(false);
          }}
        />
      ) : null}

      {isKiosk && idleWarningVisible ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Kiosk idle reset warning">
          <div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Still ordering?</p>
            <h2 className="mt-3 text-4xl font-semibold">This kiosk will reset soon</h2>
            <p className="mt-4 text-xl leading-8 text-[#65756f]">
              Touch anywhere to continue. Session resets in {idleSecondsRemaining} seconds.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="min-h-16 flex-1 rounded-2xl bg-[#13201d] px-6 text-xl font-semibold text-white"
                onClick={() => setIdleWarningVisible(false)}
              >
                Continue ordering
              </button>
              <button
                className="min-h-16 flex-1 rounded-2xl border border-[#d9d4ca] bg-white px-6 text-xl font-semibold text-[#182522]"
                onClick={resetSession}
              >
                Start over now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function CartPanel({
  mode = "customer",
  cart,
  currency,
  customerName,
  customerNote,
  error,
  isPending,
  restaurantOpen,
  unavailableItemIds = [],
  onNameChange,
  onNoteChange,
  onPlaceOrder,
  onUpdateQuantity,
}: {
  mode?: "customer" | "kiosk";
  cart: CartItem[];
  currency: string;
  customerName: string;
  customerNote: string;
  error: string;
  isPending: boolean;
  restaurantOpen: boolean;
  unavailableItemIds?: string[];
  onNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPlaceOrder: () => void;
  onUpdateQuantity: (key: string, quantity: number) => void;
}) {
  const isKiosk = mode === "kiosk";
  const totalCents = cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unavailableItemSet = useMemo(() => new Set(unavailableItemIds), [unavailableItemIds]);
  const hasUnavailableItems = unavailableItemIds.length > 0;

  return (
    <div className={`border border-[#e0ddd4] bg-white shadow-[0_10px_28px_rgba(28,39,35,0.07)] ${isKiosk ? "rounded-3xl p-5" : "rounded-xl p-3 sm:rounded-2xl sm:p-4 sm:shadow-[0_14px_42px_rgba(28,39,35,0.08)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={`font-semibold ${isKiosk ? "text-3xl" : "text-base sm:text-lg"}`}>Your order</h2>
          <p className={`mt-0.5 leading-5 text-[#65756f] sm:mt-1 ${isKiosk ? "text-base" : "text-xs sm:text-sm"}`}>{cart.length ? cartCountLabel(count) : "Start by adding menu items."}</p>
        </div>
        <span className={`rounded-full bg-[#eef8f5] font-semibold text-teal-800 ${isKiosk ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs"}`}>Counter pay</span>
      </div>

      <div className={`mt-3 space-y-2.5 sm:mt-4 sm:space-y-3 ${isKiosk ? "max-h-[42vh] overflow-y-auto pr-1" : ""}`}>
        {cart.length ? (
          cart.map((item) => {
            const isUnavailable = unavailableItemSet.has(item.menuItemId);
            return (
              <div key={item.key} className={`border border-[#eee9df] bg-[#fbfaf7] ${isKiosk ? "rounded-2xl p-4" : "rounded-xl p-2.5 sm:rounded-2xl sm:p-3"}`}>
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold leading-snug ${isKiosk ? "text-xl" : ""}`}>{item.name}</p>
                      {isUnavailable ? <Badge tone="danger">Unavailable</Badge> : null}
                    </div>
                    {item.selectedOptions.length ? (
                      <p className="mt-1 text-xs leading-5 text-[#65756f]">
                        {item.selectedOptions.map((option) => option.optionName).join(", ")}
                      </p>
                    ) : null}
                    {item.note ? <p className="mt-1 text-xs leading-5 text-[#65756f]">Note: {item.note}</p> : null}
                    {isUnavailable ? (
                      <p className="mt-1 text-xs font-semibold text-rose-700">Remove this item before placing the order.</p>
                    ) : null}
                  </div>
                  <p className={`shrink-0 font-semibold ${isKiosk ? "text-xl" : ""}`}>{formatMoney(item.unitPriceCents * item.quantity, currency)}</p>
                </div>
                <div className="mt-2.5 flex items-center gap-2 sm:mt-3">
                  <Button
                    className={`rounded-full ${isKiosk ? "min-h-14 min-w-14 px-4 text-xl" : "px-3"}`}
                    variant="secondary"
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => onUpdateQuantity(item.key, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className={`text-center font-semibold ${isKiosk ? "w-12 text-xl" : "w-8"}`}>{item.quantity}</span>
                  <Button
                    className={`rounded-full ${isKiosk ? "min-h-14 min-w-14 px-4 text-xl" : "px-3"}`}
                    variant="secondary"
                    aria-label={`Increase ${item.name}`}
                    disabled={item.quantity >= 20}
                    onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button className={`ml-auto rounded-full ${isKiosk ? "min-h-14 px-5 text-lg" : "px-3"}`} variant="ghost" onClick={() => onUpdateQuantity(item.key, 0)}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`bg-[#fbfaf7] leading-6 text-[#65756f] ${isKiosk ? "rounded-2xl p-5 text-lg" : "rounded-xl p-3 text-sm sm:rounded-2xl sm:p-4"}`}>
            {isKiosk ? "Tap menu items to build your order." : "Add items to build your order. Your cart is saved on this phone if the page refreshes."}
          </div>
        )}
      </div>

      <label className={`mt-3 block font-semibold sm:mt-4 ${isKiosk ? "text-lg" : "text-sm"}`}>
        Name for pickup
        <input
          value={customerName}
          onChange={(event) => onNameChange(event.target.value)}
          className={`mt-2 w-full rounded-xl border border-[#d9d4ca] bg-white px-3 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 ${isKiosk ? "min-h-16 text-xl" : "min-h-11 sm:min-h-12"}`}
          placeholder="Optional"
          maxLength={80}
        />
      </label>
      <label className={`mt-3 block font-semibold sm:mt-4 ${isKiosk ? "text-lg" : "text-sm"}`}>
        Order note
        <textarea
          value={customerNote}
          onChange={(event) => onNoteChange(event.target.value)}
          className={`mt-2 w-full rounded-xl border border-[#d9d4ca] bg-white px-3 py-2 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 ${isKiosk ? "min-h-28 text-xl" : "min-h-20 sm:min-h-24"}`}
          placeholder="Optional note for cashier or kitchen"
          maxLength={240}
        />
      </label>

      {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-700">{error}</p> : null}
      {!restaurantOpen ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          Ordering is paused right now. You can review the cart, but checkout is disabled until the restaurant reopens.
        </p>
      ) : null}
      {hasUnavailableItems ? (
        <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-700">
          Some cart items are no longer available. Remove the marked items before placing the order.
        </p>
      ) : null}

      <div className={`mt-3 bg-[#13201d] text-white sm:mt-4 ${isKiosk ? "rounded-3xl p-5" : "rounded-xl p-3 sm:rounded-2xl sm:p-4"}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-semibold ${isKiosk ? "text-xl" : ""}`}>Total</span>
          <span className={`font-semibold ${isKiosk ? "text-4xl" : "text-xl sm:text-2xl"}`}>{formatMoney(totalCents, currency)}</span>
        </div>
        <p className={`mt-1.5 leading-5 text-[#bdd9d2] sm:mt-2 ${isKiosk ? "text-base" : "text-xs sm:text-sm"}`}>Payment is made at the counter. The kitchen starts after cashier confirms payment.</p>
      </div>
      <Button className={`mt-4 w-full rounded-xl ${isKiosk ? "min-h-16 text-xl" : ""}`} disabled={!cart.length || isPending || hasUnavailableItems || !restaurantOpen} onClick={onPlaceOrder}>
        {isPending ? "Placing order..." : "Place order"}
      </Button>
    </div>
  );
}

function MenuImage({
  src,
  className,
  loading,
}: {
  src: string | null;
  className: string;
  loading: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} grid place-items-center bg-[#edf0e8] text-xs font-semibold text-[#79867f]`}>
        Photo
      </div>
    );
  }

  return (
    // Remote menu photos come from Cloudinary or configured menu URLs; this keeps the MVP lightweight.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  );
}

function KioskStartScreen({
  restaurant,
  onStart,
}: {
  restaurant: MenuResponse["restaurant"];
  onStart: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ed] p-8 text-[#182522]">
      <section className="grid w-full max-w-6xl gap-8 overflow-hidden rounded-[2rem] border border-[#e0ddd4] bg-[#13201d] p-10 text-white shadow-[0_28px_90px_rgba(19,32,29,0.2)] lg:grid-cols-[1fr_360px] lg:p-14">
        <div className="flex min-h-[560px] flex-col justify-between">
          <div>
            <p className="text-lg font-bold uppercase tracking-[0.16em] text-teal-200">OrderKo.com kiosk</p>
            <h1 className="mt-6 text-7xl font-semibold leading-none">{restaurant.name}</h1>
            <p className="mt-6 max-w-3xl text-2xl leading-10 text-[#d7e4de]">{restaurant.description}</p>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-[#aebdb7]">{restaurant.address}</p>
          </div>

          <div className="mt-10 grid gap-4 text-xl text-[#edf7f3] md:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-5">Tap items</div>
            <div className="rounded-3xl bg-white/10 p-5">Get order number</div>
            <div className="rounded-3xl bg-white/10 p-5">Pay at counter</div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[1.75rem] bg-white p-8 text-[#182522]">
          <p className="text-lg font-semibold text-teal-700">{restaurant.isOpen ? "Ready to order" : "Ordering paused"}</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">Start your order here</h2>
          <p className="mt-4 text-xl leading-8 text-[#65756f]">
            Place your order on this kiosk, then take your order number to the counter to pay.
          </p>
          {!restaurant.isOpen ? (
            <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-lg leading-7 text-rose-700">
              This restaurant is currently closed for ordering. Please ask the counter for help.
            </p>
          ) : null}
          <button
            className="mt-8 min-h-24 rounded-[1.5rem] bg-teal-700 px-8 text-3xl font-semibold text-white shadow-[0_18px_50px_rgba(15,118,110,0.28)] transition active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-600"
            disabled={!restaurant.isOpen}
            onClick={onStart}
          >
            Start Order
          </button>
        </div>
      </section>
    </main>
  );
}

function KioskConfirmationScreen({
  confirmation,
  secondsRemaining,
  onNewOrder,
}: {
  confirmation: KioskConfirmation;
  secondsRemaining: number;
  onNewOrder: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ed] p-8 text-[#182522]">
      <section className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#dce7e2] bg-white shadow-[0_28px_90px_rgba(28,39,35,0.14)]">
        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          <div className="bg-teal-700 p-10 text-white lg:p-14">
            <p className="text-lg font-bold uppercase tracking-[0.16em] text-teal-100">Order placed</p>
            <h1 className="mt-6 text-8xl font-semibold leading-none">#{confirmation.orderNumber}</h1>
            <p className="mt-6 text-3xl font-semibold">Please proceed to the counter to pay.</p>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-teal-50">
              Show this number to the cashier. The kitchen starts after payment is confirmed.
            </p>
            <div className="mt-8 rounded-3xl bg-white/12 p-5 text-xl text-teal-50">
              This kiosk resets automatically in {secondsRemaining} seconds.
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 p-8 lg:p-10">
            <div>
              <h2 className="text-3xl font-semibold">Track on your phone</h2>
              <p className="mt-3 text-lg leading-7 text-[#65756f]">
                Scan this QR if you want to follow your order status after leaving the kiosk.
              </p>
              <div className="mt-6 grid min-h-[280px] place-items-center rounded-[1.5rem] border border-[#e0ddd4] bg-[#fbfaf7] p-5">
                {confirmation.qrDataUrl ? (
                  // QR data URL is generated locally from the existing protected order status URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={confirmation.qrDataUrl} alt="Scan to track this order" className="size-64 rounded-2xl bg-white p-2" />
                ) : (
                  <p className="text-center text-lg leading-7 text-[#65756f]">
                    {confirmation.qrError || "Preparing tracking QR..."}
                  </p>
                )}
              </div>
              {confirmation.qrError ? <p className="mt-3 text-sm leading-6 text-rose-700">{confirmation.qrError}</p> : null}
              <a
                href={confirmation.trackingUrl}
                className="mt-4 flex min-h-14 items-center justify-center rounded-2xl border border-[#d9d4ca] bg-white px-5 text-lg font-semibold text-[#182522]"
              >
                Track Order
              </a>
            </div>

            <button
              className="min-h-20 rounded-[1.35rem] bg-[#13201d] px-6 text-2xl font-semibold text-white"
              onClick={onNewOrder}
            >
              New Order
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ItemModal({
  item,
  currency,
  mode = "customer",
  onClose,
  onAdd,
}: {
  item: MenuItemDto;
  currency: string;
  mode?: "customer" | "kiosk";
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const isKiosk = mode === "kiosk";
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionDto[]>([]);

  const optionsTotal = selectedOptions.reduce((sum, option) => sum + option.priceCents, 0);
  const unitPriceCents = item.priceCents + optionsTotal;
  const missingRequired = useMemo(
    () =>
      item.optionGroups.some(
        (group) =>
          group.required &&
          !selectedOptions.some((selected) => selected.groupName === group.name),
      ),
    [item.optionGroups, selectedOptions],
  );

  function toggleOption(groupName: string, optionName: string, priceCents: number, maxChoices: number) {
    setSelectedOptions((current) => {
      const exists = current.some((option) => option.groupName === groupName && option.optionName === optionName);
      if (exists) {
        return current.filter((option) => !(option.groupName === groupName && option.optionName === optionName));
      }
      const otherGroups = current.filter((option) => option.groupName !== groupName);
      const groupOptions = current.filter((option) => option.groupName === groupName);
      const nextGroupOptions = maxChoices === 1 ? [] : groupOptions.slice(0, Math.max(0, maxChoices - 1));
      return [...otherGroups, ...nextGroupOptions, { groupName, optionName, priceCents }];
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex h-[100dvh] items-end bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`mx-auto flex w-full animate-[sheetIn_180ms_ease-out] flex-col overflow-hidden bg-white shadow-2xl ${isKiosk ? "max-h-[92dvh] max-w-4xl rounded-3xl" : "max-h-[92dvh] max-w-xl rounded-t-[1.25rem] sm:max-h-[94dvh] sm:rounded-2xl"}`}>
        <div className="relative">
          <MenuImage src={item.imageUrl} className={isKiosk ? "h-72 w-full" : "h-40 w-full sm:h-56"} loading="eager" />
          <button
            className={`absolute right-3 top-3 grid place-items-center rounded-full bg-white/95 text-xl shadow-sm ${isKiosk ? "size-14" : "size-11"}`}
            onClick={onClose}
            aria-label="Close item details"
          >
            x
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto ${isKiosk ? "p-6" : "p-4 sm:p-5"}`}>
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Menu item</p>
              <h2 className={`mt-1.5 font-semibold leading-tight sm:mt-2 ${isKiosk ? "text-4xl" : "text-xl sm:text-2xl"}`}>{item.name}</h2>
              <p className={`mt-1.5 text-[#65756f] sm:mt-2 ${isKiosk ? "text-xl leading-8" : "text-sm leading-6 sm:text-base sm:leading-7"}`}>{item.description}</p>
            </div>
            <span className={`shrink-0 rounded-full bg-[#eef8f5] px-3 py-1 font-semibold text-teal-800 ${isKiosk ? "text-xl" : "text-sm"}`}>
              {formatMoney(item.priceCents, currency)}
            </span>
          </div>

          {item.optionGroups.length ? (
            <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
              {item.optionGroups.map((group) => (
                <section key={group.name}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`font-semibold ${isKiosk ? "text-xl" : ""}`}>{group.name}</h3>
                    <span className="text-xs text-[#65756f]">{group.required ? "Required" : `Up to ${group.maxChoices}`}</span>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {group.options.map((option) => {
                      const checked = selectedOptions.some((selected) => selected.groupName === group.name && selected.optionName === option.name);
                      return (
                        <button
                          key={option.name}
                          onClick={() => toggleOption(group.name, option.name, option.priceCents, group.maxChoices)}
                          className={`flex items-center justify-between rounded-xl border text-left transition active:scale-[0.99] ${isKiosk ? "min-h-16 px-5 text-xl" : "min-h-12 px-3 sm:min-h-13 sm:px-4"} ${
                            checked ? "border-teal-600 bg-teal-50" : "border-[#e2ded4] bg-white"
                          }`}
                        >
                          <span className="font-medium">{option.name}</span>
                          <span className="text-sm text-[#65756f]">{option.priceCents ? `+${formatMoney(option.priceCents, currency)}` : "Included"}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          <label className={`mt-4 block font-semibold sm:mt-5 ${isKiosk ? "text-xl" : "text-sm"}`}>
            Item note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={`mt-2 w-full rounded-xl border border-[#d9d4ca] px-3 py-2 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 ${isKiosk ? "min-h-28 text-xl" : "min-h-20 sm:min-h-24"}`}
              placeholder="Example: less ice, sauce on side"
              maxLength={160}
            />
          </label>
        </div>
        <div className={`border-t border-[#e2ded4] bg-white ${isKiosk ? "p-6" : "p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))]"}`}>
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <div className="flex items-center gap-2">
              <Button className={`rounded-full ${isKiosk ? "min-h-16 min-w-16 text-2xl" : "px-3"}`} variant="secondary" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </Button>
              <span className={`text-center font-semibold ${isKiosk ? "w-16 text-2xl" : "w-10"}`}>{quantity}</span>
              <Button className={`rounded-full ${isKiosk ? "min-h-16 min-w-16 text-2xl" : "px-3"}`} variant="secondary" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(20, quantity + 1))}>
                +
              </Button>
            </div>
            <span className={`font-semibold ${isKiosk ? "text-4xl" : "text-xl"}`}>{formatMoney(unitPriceCents * quantity, currency)}</span>
          </div>
          <Button
            className={`w-full rounded-xl ${isKiosk ? "min-h-16 text-xl" : ""}`}
            disabled={missingRequired}
            onClick={() =>
              onAdd({
                key: itemKey(item.id, selectedOptions, note),
                menuItemId: item.id,
                name: item.name,
                unitPriceCents,
                quantity,
                note,
                selectedOptions,
              })
            }
          >
            {missingRequired ? "Choose required option" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
