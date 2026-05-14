"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { Badge, Button } from "@/components/ui";
import { OrderKoBrand } from "@/components/orderko-brand";

type StaffCredentialSummary = {
  role: string;
  isActive: boolean;
  updatedAt: string;
};

type SuperAdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  isOpen: boolean;
  isServiceActive: boolean;
  isKioskEnabled: boolean;
  superAdminNotes: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  staffCredentials: StaffCredentialSummary[];
  _count: { categories: number; menuItems: number; orders: number };
};

type CreatedRestaurant = SuperAdminRestaurant | null;
type StatusFilter = "all" | "active" | "paused" | "closed" | "kiosk-off";

function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function restaurantLinks(slug: string) {
  return {
    customer: absoluteUrl(`/r/${slug}`),
    kiosk: absoluteUrl(`/k/${slug}`),
    staff: absoluteUrl("/staff/login"),
    admin: absoluteUrl("/admin"),
  };
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function SuperAdminDashboard({
  initialRestaurants,
}: {
  initialRestaurants: SuperAdminRestaurant[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [created, setCreated] = useState<CreatedRestaurant>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const filteredRestaurants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const statusMatches =
        filter === "all" ||
        (filter === "active" && restaurant.isServiceActive) ||
        (filter === "paused" && !restaurant.isServiceActive) ||
        (filter === "closed" && !restaurant.isOpen) ||
        (filter === "kiosk-off" && !restaurant.isKioskEnabled);
      if (!statusMatches) return false;
      if (!normalized) return true;
      const links = restaurantLinks(restaurant.slug);
      return [
        restaurant.name,
        restaurant.slug,
        restaurant.currency,
        restaurant.isOpen ? "open" : "closed",
        restaurant.isServiceActive ? "active" : "paused",
        restaurant.isKioskEnabled ? "kiosk on" : "kiosk off",
        restaurant.superAdminNotes ?? "",
        restaurant._count.categories.toString(),
        restaurant._count.menuItems.toString(),
        restaurant._count.orders.toString(),
        links.customer,
        links.kiosk,
        links.staff,
        links.admin,
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [filter, query, restaurants]);

  function logout() {
    startTransition(async () => {
      await fetch("/api/super-admin/logout", { method: "POST" });
      window.location.assign("/super-admin/login");
    });
  }

  function createRestaurant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    startTransition(async () => {
      const response = await fetch("/api/super-admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        restaurant?: SuperAdminRestaurant;
        error?: string;
        issues?: { message: string; path: (string | number)[] }[];
      } | null;
      if (!response.ok || !result?.restaurant) {
        const issue = result?.issues?.[0];
        setError(issue ? `${issue.path.join(".")}: ${issue.message}` : result?.error ?? "Could not create restaurant.");
        return;
      }
      setRestaurants((current) => [result.restaurant!, ...current]);
      setCreated(result.restaurant);
      setExpandedIds((current) => new Set(current).add(result.restaurant!.id));
      form.reset();
    });
  }

  function updateRestaurant(id: string, payload: Record<string, unknown>, errorMessage: string) {
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/super-admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        restaurant?: SuperAdminRestaurant;
        error?: string;
        issues?: { message: string; path: (string | number)[] }[];
      } | null;
      if (!response.ok || !result?.restaurant) {
        const issue = result?.issues?.[0];
        setError(issue ? `${issue.path.join(".")}: ${issue.message}` : result?.error ?? errorMessage);
        return;
      }
      setRestaurants((current) => current.map((item) => (item.id === result.restaurant!.id ? result.restaurant! : item)));
      setCreated((current) => (current?.id === result.restaurant!.id ? result.restaurant! : current));
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-6 text-[#16211f]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#dbe4df] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <OrderKoBrand label="OrderKo operator" />
            <h1 className="mt-2 text-3xl font-semibold">Super admin</h1>
            <p className="mt-1 text-sm text-slate-500">Create restaurant tenants and manage service controls.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
              placeholder="Search restaurants, notes, links..."
            />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as StatusFilter)}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="paused">Paused subscription</option>
              <option value="closed">Closed</option>
              <option value="kiosk-off">Kiosk off</option>
            </select>
            <Button variant="secondary" disabled={pending} onClick={logout}>Logout</Button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Create restaurant</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">New restaurants start closed until their menu and QR flow are tested.</p>
            <form className="mt-4 grid gap-3" onSubmit={createRestaurant}>
              <Field name="name" label="Restaurant name" placeholder="G-Cafe" />
              <Field name="slug" label="Slug" placeholder="g-cafe" helper="Lowercase letters, numbers, and hyphens." />
              <Field name="description" label="Description" placeholder="Fast counter ordering for drinks and meals." />
              <Field name="address" label="Address" placeholder="Street, city, province" />
              <Field name="currency" label="Currency" defaultValue="PHP" placeholder="PHP" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="adminPin" label="Admin PIN" type="password" />
                <Field name="adminPinConfirm" label="Confirm admin PIN" type="password" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="cashierPin" label="Cashier PIN" type="password" />
                <Field name="cashierPinConfirm" label="Confirm cashier PIN" type="password" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="kitchenPin" label="Kitchen PIN" type="password" />
                <Field name="kitchenPinConfirm" label="Confirm kitchen PIN" type="password" />
              </div>
              <Button className="mt-2" disabled={pending}>{pending ? "Creating..." : "Create restaurant"}</Button>
            </form>
          </section>

          <div className="space-y-6">
            {created ? <CreatedSummary restaurant={created} /> : null}
            <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Restaurants</h2>
                  <p className="mt-1 text-sm text-slate-500">{filteredRestaurants.length} shown from {restaurants.length} total.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    busy={pending}
                    expanded={expandedIds.has(restaurant.id)}
                    onToggleExpanded={() => toggleExpanded(restaurant.id)}
                    onUpdate={(payload, message) => updateRestaurant(restaurant.id, payload, message)}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function CreatedSummary({ restaurant }: { restaurant: SuperAdminRestaurant }) {
  const links = restaurantLinks(restaurant.slug);
  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-teal-950">Restaurant created</h2>
      <p className="mt-1 text-sm leading-6 text-teal-800">
        {restaurant.name} is closed by default. Add menu items, place one test order, then print the QR before launch.
      </p>
      <div className="mt-4 grid gap-2">
        <CopyLine label="Customer menu" value={links.customer} />
        <CopyLine label="Kiosk" value={links.kiosk} />
        <CopyLine label="Staff login" value={links.staff} />
        <CopyLine label="Admin" value={links.admin} />
      </div>
    </section>
  );
}

function RestaurantCard({
  restaurant,
  busy,
  expanded,
  onToggleExpanded,
  onUpdate,
}: {
  restaurant: SuperAdminRestaurant;
  busy: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onUpdate: (payload: Record<string, unknown>, errorMessage: string) => void;
}) {
  const links = useMemo(() => restaurantLinks(restaurant.slug), [restaurant.slug]);
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <button type="button" className="w-full text-left" onClick={onToggleExpanded}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{restaurant.name}</h3>
              <Badge tone={restaurant.isServiceActive ? "good" : "danger"}>{restaurant.isServiceActive ? "Service active" : "Service paused"}</Badge>
              <Badge tone={restaurant.isOpen ? "good" : "warn"}>{restaurant.isOpen ? "Open" : "Closed"}</Badge>
              <Badge tone={restaurant.isKioskEnabled ? "good" : "danger"}>{restaurant.isKioskEnabled ? "Kiosk on" : "Kiosk off"}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {restaurant.slug} · {restaurant.currency} · Updated {dateLabel(restaurant.updatedAt)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {restaurant._count.categories} categories · {restaurant._count.menuItems} items · {restaurant._count.orders} orders
            </p>
          </div>
          <span className="text-sm font-semibold text-teal-700">{expanded ? "Collapse" : "Expand"}</span>
        </div>
      </button>

      {expanded ? (
        <div className="mt-4 grid gap-5 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={restaurant.isServiceActive ? "danger" : "primary"}
              disabled={busy}
              onClick={() => {
                if (restaurant.isServiceActive && !window.confirm(`Pause subscription/service for ${restaurant.name}?`)) return;
                onUpdate({ isServiceActive: !restaurant.isServiceActive }, "Could not update service status.");
              }}
            >
              {restaurant.isServiceActive ? "Pause service" : "Resume service"}
            </Button>
            <Button
              type="button"
              variant={restaurant.isKioskEnabled ? "danger" : "primary"}
              disabled={busy}
              onClick={() => {
                if (restaurant.isKioskEnabled && !window.confirm(`Turn kiosk off for ${restaurant.name}?`)) return;
                onUpdate({ isKioskEnabled: !restaurant.isKioskEnabled }, "Could not update kiosk status.");
              }}
            >
              {restaurant.isKioskEnabled ? "Turn kiosk off" : "Turn kiosk on"}
            </Button>
            <QrDownload slug={restaurant.slug} />
          </div>

          <div className="grid gap-2">
            <CopyLine label="Customer" value={links.customer} />
            <CopyLine label="Kiosk" value={links.kiosk} />
            <CopyLine label="Staff" value={links.staff} />
            <CopyLine label="Admin" value={links.admin} />
          </div>

          <NotesForm restaurant={restaurant} busy={busy} onUpdate={onUpdate} />
          <PinResetForm restaurant={restaurant} busy={busy} onUpdate={onUpdate} />
        </div>
      ) : null}
    </article>
  );
}

function NotesForm({
  restaurant,
  busy,
  onUpdate,
}: {
  restaurant: SuperAdminRestaurant;
  busy: boolean;
  onUpdate: (payload: Record<string, unknown>, errorMessage: string) => void;
}) {
  return (
    <form
      className="rounded-lg bg-slate-50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const notes = String(new FormData(event.currentTarget).get("superAdminNotes") || "");
        onUpdate({ superAdminNotes: notes }, "Could not save notes.");
      }}
    >
      <h4 className="font-semibold">Internal restaurant notes</h4>
      <p className="mt-1 text-xs leading-5 text-slate-500">Only Super Admin sees this. Use it for subscription, launch, contact, or support notes.</p>
      <textarea
        name="superAdminNotes"
        defaultValue={restaurant.superAdminNotes ?? ""}
        rows={4}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="2026-05-14 - Waiting for subscription payment..."
      />
      <Button
        type="submit"
        className="mt-3"
        variant="secondary"
        disabled={busy}
      >
        Save notes
      </Button>
    </form>
  );
}

function PinResetForm({
  restaurant,
  busy,
  onUpdate,
}: {
  restaurant: SuperAdminRestaurant;
  busy: boolean;
  onUpdate: (payload: Record<string, unknown>, errorMessage: string) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const roles = ["admin", "cashier", "kitchen"] as const;
    const staffPins: Partial<Record<(typeof roles)[number], string>> = {};

    for (const role of roles) {
      const pin = String(data.get(role) || "").trim();
      const confirm = String(data.get(`${role}Confirm`) || "").trim();
      if (!pin && !confirm) continue;
      if (pin !== confirm) {
        window.alert(`${role} PIN confirmation does not match.`);
        return;
      }
      staffPins[role] = pin;
    }

    if (!Object.keys(staffPins).length) return;
    if (!window.confirm(`Reset selected staff PINs for ${restaurant.name}? Existing PINs cannot be recovered.`)) return;
    onUpdate({ staffPins }, "Could not update staff PINs.");
    form.reset();
  }

  const configured = new Set(restaurant.staffCredentials.filter((credential) => credential.isActive).map((credential) => credential.role));
  return (
    <section className="rounded-lg bg-slate-50 p-4">
      <h4 className="font-semibold">Staff PIN reset</h4>
      <p className="mt-1 text-xs leading-5 text-slate-500">PINs are hashed. You can check if a role is configured and set a new PIN, but existing PINs are never displayed.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["admin", "cashier", "kitchen"].map((role) => (
          <Badge key={role} tone={configured.has(role) ? "good" : "warn"}>
            {role}: {configured.has(role) ? "configured" : "missing"}
          </Badge>
        ))}
      </div>
      <form className="mt-4 grid gap-3" onSubmit={submit}>
        {["admin", "cashier", "kitchen"].map((role) => (
          <div key={role} className="grid gap-3 sm:grid-cols-2">
            <Field name={role} label={`${role[0].toUpperCase() + role.slice(1)} new PIN`} type="password" required={false} />
            <Field name={`${role}Confirm`} label={`Confirm ${role} PIN`} type="password" required={false} />
          </div>
        ))}
        <Button type="submit" variant="secondary" disabled={busy}>Update selected PINs</Button>
      </form>
    </section>
  );
}

function QrDownload({ slug }: { slug: string }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const customerUrl = useMemo(() => restaurantLinks(slug).customer, [slug]);

  useEffect(() => {
    let canceled = false;
    async function buildQr() {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(customerUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 240,
        color: { dark: "#0f766e", light: "#ffffff" },
      });
      if (!canceled) setQrDataUrl(dataUrl);
    }
    void buildQr();
    return () => {
      canceled = true;
    };
  }, [customerUrl]);

  return (
    <a
      href={qrDataUrl || undefined}
      download={`${slug}-qr.png`}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-teal-600"
      aria-disabled={!qrDataUrl}
    >
      Download QR
    </a>
  );
}

function CopyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return (
    <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-[110px_1fr_auto] sm:items-center">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="break-all text-slate-500">{value}</span>
      <Button type="button" variant="secondary" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  helper,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  helper?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
        required={required}
      />
      {helper ? <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span> : null}
    </label>
  );
}
