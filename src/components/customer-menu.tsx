"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

const cartStoragePrefix = "orderko-cart:";

function itemKey(itemId: string, selectedOptions: SelectedOptionDto[], note: string) {
  return `${itemId}:${JSON.stringify(selectedOptions)}:${note.trim()}`;
}

function cartCountLabel(count: number) {
  return `${count} item${count === 1 ? "" : "s"}`;
}

export function CustomerMenu({ data }: { data: MenuResponse }) {
  const router = useRouter();
  const cartStorageKey = `${cartStoragePrefix}${data.restaurant.slug}`;
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
        const saved = window.localStorage.getItem(cartStorageKey);
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
        window.localStorage.removeItem(cartStorageKey);
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
  }, [cartStorageKey]);

  useEffect(() => {
    if (!cartLoaded) return;
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
  }, [cart, cartLoaded, cartStorageKey, customerName, customerNote]);

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
          order?: { orderCode: string; customerAccessToken?: string | null };
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
        window.localStorage.removeItem(cartStorageKey);
        const tokenParam = result.order.customerAccessToken ? `?t=${encodeURIComponent(result.order.customerAccessToken)}` : "";
        router.push(`/order/${result.order.orderCode}${tokenParam}`);
      } catch {
        setError("Connection dropped while placing the order. Your cart is still saved. Please retry once, then check with the counter before trying again.");
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] pb-[calc(8.75rem+env(safe-area-inset-bottom))] text-[#182522] lg:pb-10">
      <header className="sticky top-0 z-20 border-b border-[#e0ddd4] bg-[#f7f4ed]/92 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3 pb-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">OrderKo.com</p>
            <Badge tone={menuData.restaurant.isOpen ? "good" : "danger"}>
              {menuData.restaurant.isOpen ? "Open now" : "Closed"}
            </Badge>
          </div>
          <div className="relative -mx-4">
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {menuData.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    document.getElementById(category.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold shadow-sm transition active:scale-[0.98] ${
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

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-4 lg:grid-cols-[1fr_372px] lg:py-6">
        <div className="min-w-0 space-y-7">
          <section className="overflow-hidden rounded-[1.35rem] border border-[#e0ddd4] bg-[#13201d] text-white shadow-[0_22px_70px_rgba(19,32,29,0.18)]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">Scan, order, pay at counter</p>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{menuData.restaurant.name}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d7e4de]">{menuData.restaurant.description}</p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#aebdb7]">{menuData.restaurant.address}</p>
                </div>
                <div className="grid min-w-28 rounded-2xl border border-white/12 bg-white/10 p-3 text-center">
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
                <div className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-3 text-[#edf7f3]">No app download needed</div>
                  <div className="rounded-2xl bg-white/10 p-3 text-[#edf7f3]">Get an order number</div>
                  <div className="rounded-2xl bg-white/10 p-3 text-[#edf7f3]">Pay at the counter</div>
                </div>
              )}
            </div>
          </section>

          {menuData.categories.length ? (
            menuData.categories.map((category) => (
              <section key={category.id} id={category.id} className="scroll-mt-32">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold leading-tight">{category.name}</h2>
                    <p className="mt-1 text-sm text-[#66756f]">{category.items.length} menu items</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      disabled={item.isSoldOut || !menuData.restaurant.isOpen}
                      aria-disabled={item.isSoldOut || !menuData.restaurant.isOpen}
                      onClick={() => setSelectedItem(item)}
                      className="group min-h-36 overflow-hidden rounded-2xl border border-[#e2ded4] bg-white p-3 text-left shadow-[0_10px_30px_rgba(28,39,35,0.06)] transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-[0_16px_38px_rgba(28,39,35,0.1)] active:scale-[0.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <div className="flex h-full gap-3">
                        <MenuImage src={item.imageUrl} className="h-28 w-28 shrink-0 rounded-xl sm:h-32 sm:w-32" loading="lazy" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="min-w-0 text-base font-semibold leading-snug text-[#182522]">{item.name}</h3>
                            {item.isSoldOut ? <Badge tone="danger">Sold out</Badge> : null}
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#65756f]">{item.description}</p>
                          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                            <p className="font-semibold text-teal-800">{formatMoney(item.priceCents, menuData.restaurant.currency)}</p>
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#17211f] text-lg font-semibold text-white transition group-hover:bg-teal-700">
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

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <CartPanel
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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ded8cc] bg-white/96 px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_36px_rgba(20,31,28,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto max-w-md">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[#65756f]">{cartLoaded ? cartCountLabel(count) : "Loading cart"}</p>
              <p className="text-sm text-[#65756f]">Review before paying at counter</p>
            </div>
            <span className="text-xl font-semibold">{formatMoney(totalCents, menuData.restaurant.currency)}</span>
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
          <div className="flex max-h-[92dvh] w-full animate-[sheetIn_180ms_ease-out] flex-col rounded-t-[1.4rem] bg-[#f7f4ed] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e1dbcf] px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">Review order</h2>
                <p className="text-sm text-[#65756f]">Pay at the counter after placing it.</p>
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
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <CartPanel
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
          onClose={() => setSelectedItem(null)}
          onAdd={(cartItem) => {
            addToCart(cartItem);
            setSelectedItem(null);
            setMobileCartOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

function CartPanel({
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
  const totalCents = cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unavailableItemSet = useMemo(() => new Set(unavailableItemIds), [unavailableItemIds]);
  const hasUnavailableItems = unavailableItemIds.length > 0;

  return (
    <div className="rounded-2xl border border-[#e0ddd4] bg-white p-4 shadow-[0_14px_42px_rgba(28,39,35,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your order</h2>
          <p className="mt-1 text-sm leading-5 text-[#65756f]">{cart.length ? cartCountLabel(count) : "Start by adding menu items."}</p>
        </div>
        <span className="rounded-full bg-[#eef8f5] px-3 py-1 text-xs font-semibold text-teal-800">Counter pay</span>
      </div>

      <div className="mt-4 space-y-3">
        {cart.length ? (
          cart.map((item) => {
            const isUnavailable = unavailableItemSet.has(item.menuItemId);
            return (
              <div key={item.key} className="rounded-2xl border border-[#eee9df] bg-[#fbfaf7] p-3">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-snug">{item.name}</p>
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
                  <p className="shrink-0 font-semibold">{formatMoney(item.unitPriceCents * item.quantity, currency)}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    className="rounded-full px-3"
                    variant="secondary"
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => onUpdateQuantity(item.key, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <Button
                    className="rounded-full px-3"
                    variant="secondary"
                    aria-label={`Increase ${item.name}`}
                    disabled={item.quantity >= 20}
                    onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button className="ml-auto rounded-full px-3" variant="ghost" onClick={() => onUpdateQuantity(item.key, 0)}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#65756f]">
            Add items to build your order. Your cart is saved on this phone if the page refreshes.
          </div>
        )}
      </div>

      <label className="mt-4 block text-sm font-semibold">
        Name for pickup
        <input
          value={customerName}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-xl border border-[#d9d4ca] bg-white px-3 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          placeholder="Optional"
          maxLength={80}
        />
      </label>
      <label className="mt-4 block text-sm font-semibold">
        Order note
        <textarea
          value={customerNote}
          onChange={(event) => onNoteChange(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-xl border border-[#d9d4ca] bg-white px-3 py-2 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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

      <div className="mt-4 rounded-2xl bg-[#13201d] p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-semibold">{formatMoney(totalCents, currency)}</span>
        </div>
        <p className="mt-2 text-sm leading-5 text-[#bdd9d2]">Payment is made at the counter. The kitchen starts after cashier confirms payment.</p>
      </div>
      <Button className="mt-4 w-full rounded-xl" disabled={!cart.length || isPending || hasUnavailableItems || !restaurantOpen} onClick={onPlaceOrder}>
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

function ItemModal({
  item,
  currency,
  onClose,
  onAdd,
}: {
  item: MenuItemDto;
  currency: string;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
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
      <div className="mx-auto flex max-h-[94dvh] w-full max-w-xl animate-[sheetIn_180ms_ease-out] flex-col overflow-hidden rounded-t-[1.45rem] bg-white shadow-2xl sm:rounded-2xl">
        <div className="relative">
          <MenuImage src={item.imageUrl} className="h-52 w-full sm:h-56" loading="eager" />
          <button
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/95 text-xl shadow-sm"
            onClick={onClose}
            aria-label="Close item details"
          >
            x
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Menu item</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">{item.name}</h2>
              <p className="mt-2 leading-7 text-[#65756f]">{item.description}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#eef8f5] px-3 py-1 text-sm font-semibold text-teal-800">
              {formatMoney(item.priceCents, currency)}
            </span>
          </div>

          {item.optionGroups.length ? (
            <div className="mt-5 space-y-5">
              {item.optionGroups.map((group) => (
                <section key={group.name}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{group.name}</h3>
                    <span className="text-xs text-[#65756f]">{group.required ? "Required" : `Up to ${group.maxChoices}`}</span>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {group.options.map((option) => {
                      const checked = selectedOptions.some((selected) => selected.groupName === group.name && selected.optionName === option.name);
                      return (
                        <button
                          key={option.name}
                          onClick={() => toggleOption(group.name, option.name, option.priceCents, group.maxChoices)}
                          className={`flex min-h-13 items-center justify-between rounded-xl border px-4 text-left transition active:scale-[0.99] ${
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

          <label className="mt-5 block text-sm font-semibold">
            Item note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-xl border border-[#d9d4ca] px-3 py-2 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              placeholder="Example: less ice, sauce on side"
              maxLength={160}
            />
          </label>
        </div>
        <div className="border-t border-[#e2ded4] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button className="rounded-full px-3" variant="secondary" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </Button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <Button className="rounded-full px-3" variant="secondary" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(20, quantity + 1))}>
                +
              </Button>
            </div>
            <span className="text-xl font-semibold">{formatMoney(unitPriceCents * quantity, currency)}</span>
          </div>
          <Button
            className="w-full rounded-xl"
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
