"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { Badge, Button } from "@/components/ui";
import { OrderKoBrand } from "@/components/orderko-brand";

type SuperAdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  isOpen: boolean;
  isServiceActive: boolean;
  currency: string;
  createdAt: string;
  _count: { categories: number; menuItems: number; orders: number };
};

type CreatedRestaurant = SuperAdminRestaurant | null;

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

export function SuperAdminDashboard({
  initialRestaurants,
}: {
  initialRestaurants: SuperAdminRestaurant[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [created, setCreated] = useState<CreatedRestaurant>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/super-admin/logout", { method: "POST" });
      window.location.assign("/super-admin/login");
    });
  }

  function createRestaurant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

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
      event.currentTarget.reset();
    });
  }

  function updateServiceStatus(restaurant: SuperAdminRestaurant, isServiceActive: boolean) {
    if (!isServiceActive && !window.confirm(`Pause OrderKo service for ${restaurant.name}?`)) return;
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/super-admin/restaurants/${restaurant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isServiceActive }),
      });
      const result = (await response.json().catch(() => null)) as {
        restaurant?: SuperAdminRestaurant;
        error?: string;
      } | null;
      if (!response.ok || !result?.restaurant) {
        setError(result?.error ?? "Could not update service status.");
        return;
      }
      setRestaurants((current) =>
        current.map((item) => (item.id === result.restaurant!.id ? result.restaurant! : item)),
      );
      setCreated((current) => (current?.id === result.restaurant!.id ? result.restaurant! : current));
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-6 text-[#16211f]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#dbe4df] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <OrderKoBrand label="OrderKo operator" />
            <h1 className="mt-2 text-3xl font-semibold">Super admin</h1>
            <p className="mt-1 text-sm text-slate-500">Create restaurant tenants and prepare launch links.</p>
          </div>
          <Button variant="secondary" disabled={pending} onClick={logout}>
            Logout
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Create restaurant</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">New restaurants start closed until their menu and QR flow are tested.</p>
            {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
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
              <h2 className="text-xl font-semibold">Restaurants</h2>
              <div className="mt-4 grid gap-3">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    busy={pending}
                    onServiceStatusChange={(isServiceActive) => updateServiceStatus(restaurant, isServiceActive)}
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
  onServiceStatusChange,
}: {
  restaurant: SuperAdminRestaurant;
  busy: boolean;
  onServiceStatusChange: (isServiceActive: boolean) => void;
}) {
  const links = useMemo(() => restaurantLinks(restaurant.slug), [restaurant.slug]);
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{restaurant.name}</h3>
            <Badge tone={restaurant.isOpen ? "good" : "warn"}>{restaurant.isOpen ? "Open" : "Closed"}</Badge>
            <Badge tone={restaurant.isServiceActive ? "good" : "danger"}>{restaurant.isServiceActive ? "Active" : "Paused"}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {restaurant.slug} · {restaurant.currency} · Created {new Date(restaurant.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {restaurant._count.categories} categories · {restaurant._count.menuItems} items · {restaurant._count.orders} orders
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={restaurant.isServiceActive ? "danger" : "primary"}
            disabled={busy}
            onClick={() => onServiceStatusChange(!restaurant.isServiceActive)}
          >
            {restaurant.isServiceActive ? "Pause service" : "Resume service"}
          </Button>
          <QrDownload slug={restaurant.slug} />
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <CopyLine label="Customer" value={links.customer} />
        <CopyLine label="Kiosk" value={links.kiosk} />
        <CopyLine label="Staff" value={links.staff} />
        <CopyLine label="Admin" value={links.admin} />
      </div>
    </article>
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
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  helper?: string;
  type?: string;
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
        required
      />
      {helper ? <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span> : null}
    </label>
  );
}
