"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import { Button, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { LogoutButton } from "@/components/logout-button";
import { OrderKoBrand } from "@/components/orderko-brand";

type Category = { id: string; name: string; sortOrder: number };
type AdminMenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  optionGroupsJson: string;
  isSoldOut: boolean;
};
type EditableOption = { id: string; name: string; price: string };
type EditableOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  options: EditableOption[];
};
type RestaurantSettings = {
  id: string;
  name: string;
  description: string;
  address: string;
  slug: string;
  currency: string;
  logoUrl: string | null;
  bannerImageUrl: string | null;
  isOpen: boolean;
  staffCredentials: { role: string; isActive: boolean }[];
};

export function AdminDashboard({
  restaurant,
  categories,
  menuItems,
  analytics,
  qrBaseUrl,
}: {
  restaurant: RestaurantSettings;
  categories: Category[];
  menuItems: AdminMenuItem[];
  analytics: {
    totalOrders: number;
    completedOrders: number;
    canceledOrders: number;
    averageOrderValueCents: number;
    bestSellers: { name: string; quantity: number }[];
  };
  qrBaseUrl: string | null;
}) {
  const [settings, setSettings] = useState(restaurant);
  const [categoryList, setCategoryList] = useState(categories);
  const [items, setItems] = useState(menuItems);
  const [editing, setEditing] = useState<AdminMenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [optionGroups, setOptionGroups] = useState<EditableOptionGroup[]>([]);
  const [formHighlight, setFormHighlight] = useState(false);
  const [error, setError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [settingsUploadError, setSettingsUploadError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isBrandingUploading, setIsBrandingUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const itemFormRef = useRef<HTMLFormElement | null>(null);
  const sortedCategories = useMemo(
    () => [...categoryList].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categoryList],
  );
  const categoryById = useMemo(
    () => new Map(categoryList.map((category) => [category.id, category])),
    [categoryList],
  );
  const categoryItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [items]);
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [
        item.name,
        item.description,
        categoryById.get(item.categoryId)?.name ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [categoryById, items, searchQuery]);
  const readinessChecks = useMemo(
    () => {
      const activeStaffRoles = new Set(
        settings.staffCredentials.filter((credential) => credential.isActive).map((credential) => credential.role),
      );
      return [
        { label: "Profile details complete", done: Boolean(settings.name.trim() && settings.description.trim() && settings.address.trim()) },
        { label: "Logo uploaded", done: Boolean(settings.logoUrl) },
        { label: "Banner uploaded", done: Boolean(settings.bannerImageUrl) },
        { label: "Categories created", done: categoryList.length > 0 },
        { label: "Menu items added", done: items.length > 0 },
        { label: "Staff PINs configured", done: ["admin", "cashier", "kitchen"].every((role) => activeStaffRoles.has(role)) },
        { label: "QR base URL configured", done: Boolean(qrBaseUrl) },
        { label: "Test order placed", done: analytics.totalOrders > 0 },
        { label: "Restaurant open for ordering", done: settings.isOpen },
      ];
    },
    [analytics.totalOrders, categoryList.length, items.length, qrBaseUrl, settings],
  );
  const readinessDone = readinessChecks.filter((check) => check.done).length;
  const menuUrl = useMemo(() => {
    if (qrBaseUrl) return `${qrBaseUrl.replace(/\/$/, "")}/r/${settings.slug}`;
    if (typeof window === "undefined") return `/r/${settings.slug}`;
    return `${window.location.origin}/r/${settings.slug}`;
  }, [qrBaseUrl, settings.slug]);

  useEffect(() => {
    let canceled = false;
    async function buildQr() {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(menuUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 220,
        color: {
          dark: "#0f766e",
          light: "#ffffff",
        },
      });
      if (!canceled) setQrDataUrl(dataUrl);
    }
    void buildQr();
    return () => {
      canceled = true;
    };
  }, [menuUrl]);

  async function uploadMenuImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setError("");
    setUploadError("");
    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await fetch("/api/admin/uploads/menu-image", {
        method: "POST",
        body: uploadData,
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setUploadError(result.error ?? "Image upload failed. Please try again.");
        return;
      }
      setImageUrl(result.url);
    } catch {
      setUploadError("Could not upload image. Check the connection and try again.");
    } finally {
      setIsUploading(false);
      input.value = "";
    }
  }

  async function uploadBrandingImage(event: ChangeEvent<HTMLInputElement>, field: "logoUrl" | "bannerImageUrl") {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setSettingsError("");
    setSettingsUploadError("");
    setIsBrandingUploading(true);

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("kind", field === "logoUrl" ? "logo" : "banner");

    try {
      const response = await fetch("/api/admin/uploads/menu-image", {
        method: "POST",
        body: uploadData,
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setSettingsUploadError(result.error ?? "Branding upload failed. Please try again.");
        return;
      }
      setSettings((current) => ({ ...current, [field]: result.url! }));
    } catch {
      setSettingsUploadError("Could not upload branding image. Check the connection and try again.");
    } finally {
      setIsBrandingUploading(false);
      input.value = "";
    }
  }

  async function save(formData: FormData) {
    setError("");
    if (isUploading) {
      setError("Wait for the image upload to finish before saving.");
      return;
    }
    const optionGroupsResult = buildOptionGroupsJson(optionGroups);
    if (!optionGroupsResult.ok) {
      setError(optionGroupsResult.error);
      return;
    }
    const payload = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      priceCents: Math.round(Number(formData.get("price") ?? 0) * 100),
      categoryId: String(formData.get("categoryId") ?? ""),
      imageUrl: imageUrl.trim(),
      optionGroupsJson: optionGroupsResult.value,
      isSoldOut: formData.get("isSoldOut") === "on",
    };
    if (!payload.categoryId) {
      setError("Add a category before saving a menu item.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(editing ? `/api/admin/menu-items/${editing.id}` : "/api/admin/menu-items", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { item?: AdminMenuItem; error?: string };
      if (!response.ok || !result.item) {
        setError(result.error ?? "Could not save menu item.");
        return;
      }
      const savedItem = result.item;
      setItems((current) =>
        editing
          ? current.map((item) => (item.id === savedItem.id ? savedItem : item))
          : [...current, savedItem],
      );
      setEditing(null);
      setImageUrl("");
      setOptionGroups([]);
      setUploadError("");
      setFormVersion((current) => current + 1);
    });
  }

  function beginEditing(item: AdminMenuItem) {
    setEditing(item);
    setImageUrl(item.imageUrl ?? "");
    setOptionGroups(parseEditableOptionGroups(item.optionGroupsJson));
    setUploadError("");
    setError("");
    setFormHighlight(true);
    window.setTimeout(() => {
      itemFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    window.setTimeout(() => setFormHighlight(false), 1200);
  }

  function cancelEditing() {
    setEditing(null);
    setImageUrl("");
    setOptionGroups([]);
    setUploadError("");
    setError("");
  }

  function patchItem(id: string, payload: Partial<AdminMenuItem>) {
    startTransition(async () => {
      const current = items.find((item) => item.id === id);
      if (!current) return;
      const response = await fetch(`/api/admin/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, ...payload }),
      });
      const result = (await response.json()) as { item?: AdminMenuItem; error?: string };
      if (!response.ok || !result.item) {
        setError(result.error ?? "Could not update item.");
        return;
      }
      setItems((currentItems) => currentItems.map((item) => (item.id === id ? result.item! : item)));
    });
  }

  function deleteItem(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Could not delete item.");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
    });
  }

  async function saveSettings(formData: FormData) {
    setSettingsError("");
    const payload = {
      name: String(formData.get("restaurantName") ?? ""),
      description: String(formData.get("restaurantDescription") ?? ""),
      address: String(formData.get("restaurantAddress") ?? ""),
      slug: String(formData.get("restaurantSlug") ?? ""),
      currency: String(formData.get("restaurantCurrency") ?? "").toUpperCase(),
      logoUrl: String(formData.get("restaurantLogoUrl") ?? ""),
      bannerImageUrl: String(formData.get("restaurantBannerImageUrl") ?? ""),
      isOpen: formData.get("restaurantIsOpen") === "on",
    };

    startTransition(async () => {
      const response = await fetch("/api/admin/restaurant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { restaurant?: RestaurantSettings; error?: string };
      if (!response.ok || !result.restaurant) {
        setSettingsError(result.error ?? "Could not save restaurant settings.");
        return;
      }
      setSettings(result.restaurant);
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-6 text-[#16211f]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#dbe4df] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <OrderKoBrand label="OrderKo admin" />
            <h1 className="mt-2 text-3xl font-semibold">Owner dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Manage {settings.name}, QR ordering, and the operational basics.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total orders" value={analytics.totalOrders.toString()} />
          <Metric label="Completed" value={analytics.completedOrders.toString()} />
          <Metric label="Canceled" value={analytics.canceledOrders.toString()} />
          <Metric label="Average order" value={formatMoney(analytics.averageOrderValueCents, settings.currency)} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Launch readiness</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Use this before printing QR codes or inviting customers to order.</p>
              </div>
              <Badge tone={readinessDone === readinessChecks.length ? "good" : "warn"}>
                {readinessDone}/{readinessChecks.length} ready
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {readinessChecks.map((check) => (
                <div key={check.label} className={`rounded-lg border p-3 text-sm font-semibold ${check.done ? "border-teal-200 bg-teal-50 text-teal-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                  {check.done ? "✓" : "•"} {check.label}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm lg:col-span-2">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <form action={saveSettings}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Restaurant settings</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">These details appear on the QR menu and staff views.</p>
                  </div>
                  <Badge tone={settings.isOpen ? "good" : "danger"}>{settings.isOpen ? "Open" : "Closed"}</Badge>
                </div>
                {settingsError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{settingsError}</p> : null}
                {settingsUploadError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{settingsUploadError}</p> : null}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field name="restaurantName" label="Restaurant name" defaultValue={settings.name} />
                  <Field name="restaurantSlug" label="QR menu slug" defaultValue={settings.slug} />
                </div>
                <label className="mt-4 block text-sm font-semibold">
                  Address
                  <textarea
                    name="restaurantAddress"
                    defaultValue={settings.address}
                    className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="mt-4 block text-sm font-semibold">
                  Description
                  <textarea
                    name="restaurantDescription"
                    defaultValue={settings.description}
                    className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
                    required
                  />
                </label>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field name="restaurantCurrency" label="Currency" defaultValue={settings.currency} />
                  <label className="flex min-h-11 items-end gap-3 pb-2 text-sm font-semibold">
                    <input name="restaurantIsOpen" type="checkbox" defaultChecked={settings.isOpen} className="size-5" />
                    Accept customer orders
                  </label>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <BrandingImageField
                    label="Restaurant logo"
                    name="restaurantLogoUrl"
                    value={settings.logoUrl ?? ""}
                    previewClassName="h-28 w-full object-contain p-3"
                    isUploading={isBrandingUploading}
                    onUpload={(event) => uploadBrandingImage(event, "logoUrl")}
                    onChange={(value) => setSettings((current) => ({ ...current, logoUrl: value }))}
                  />
                  <BrandingImageField
                    label="Banner image"
                    name="restaurantBannerImageUrl"
                    value={settings.bannerImageUrl ?? ""}
                    previewClassName="h-28 w-full object-cover"
                    isUploading={isBrandingUploading}
                    onUpload={(event) => uploadBrandingImage(event, "bannerImageUrl")}
                    onChange={(value) => setSettings((current) => ({ ...current, bannerImageUrl: value }))}
                  />
                </div>
                <Button className="mt-5" disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>
              </form>

              <div className="rounded-lg bg-[#f6f8f5] p-4">
                <h3 className="font-semibold">QR menu</h3>
                <p className="mt-1 break-all text-sm leading-6 text-slate-500">{menuUrl}</p>
                {qrBaseUrl ? (
                  <p className="mt-2 rounded-md bg-teal-50 p-2 text-xs leading-5 text-teal-800">
                    This QR uses the local network address so phones on the same Wi-Fi can open it.
                  </p>
                ) : null}
                <div className="mt-4 grid place-items-center rounded-lg bg-white p-4">
                  {qrDataUrl ? (
                    // The QR code is a generated data URL, so Next image optimization is not useful here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt={`QR code for ${settings.name}`} className="size-52" />
                  ) : (
                    <div className="size-52 animate-pulse rounded bg-slate-100" />
                  )}
                </div>
                <a
                  href={qrDataUrl}
                  download={`${settings.slug}-qr.png`}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-teal-600"
                >
                  Download QR
                </a>
              </div>
            </div>
          </section>

          <div className="space-y-4">
          <CategoryManager
            categories={sortedCategories}
            itemCounts={categoryItemCounts}
            onCategoriesChange={setCategoryList}
          />

          <StaffPinManager />

          <form
            ref={itemFormRef}
            key={editing?.id ?? `new-${formVersion}`}
            action={save}
            className={`scroll-mt-6 rounded-lg border bg-white p-5 shadow-sm transition ${
              formHighlight ? "border-teal-500 ring-4 ring-teal-100" : "border-[#dbe4df]"
            }`}
          >
            <h2 className="text-xl font-semibold">{editing ? `Editing: ${editing.name}` : "Add menu item"}</h2>
            {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
            <Field name="name" label="Name" defaultValue={editing?.name ?? ""} />
            <label className="mt-4 block text-sm font-semibold">
              Description
              <textarea
                name="description"
                defaultValue={editing?.description ?? ""}
                className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold">
                Price
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing ? (editing.priceCents / 100).toFixed(2) : ""}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                Category
                <select
                  name="categoryId"
                  defaultValue={editing?.categoryId ?? sortedCategories[0]?.id ?? ""}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                  disabled={!sortedCategories.length}
                  required
                >
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Menu photo</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Upload a JPG, PNG, or WebP image up to 5 MB.</p>
                </div>
                {imageUrl ? (
                  <Button type="button" variant="ghost" onClick={() => setImageUrl("")}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {imageUrl ? (
                  // Admin preview uses externally hosted menu photos; Next image optimization is not required here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Menu item preview" className="h-40 w-full object-cover" />
                ) : (
                  <div className="grid h-40 place-items-center text-sm text-slate-400">No photo selected</div>
                )}
              </div>
              <label className="mt-3 block">
                <span className="sr-only">Upload menu photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadMenuImage}
                  disabled={isUploading}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
                />
              </label>
              {isUploading ? <p className="mt-2 text-sm text-teal-700">Uploading photo...</p> : null}
              {uploadError ? <p className="mt-2 rounded-md bg-rose-50 p-2 text-sm text-rose-700">{uploadError}</p> : null}
              <label className="mt-3 block text-sm font-semibold">
                Image URL
                <input
                  name="imageUrl"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
                  placeholder="https://res.cloudinary.com/..."
                />
              </label>
            </div>
            <CustomizationBuilder
              groups={optionGroups}
              currency={settings.currency}
              onChange={setOptionGroups}
            />
            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-semibold">
              <input name="isSoldOut" type="checkbox" defaultChecked={editing?.isSoldOut ?? false} className="size-5" />
              Sold out
            </label>
            <div className="mt-5 flex gap-2">
              <Button disabled={pending || isUploading || !sortedCategories.length}>{pending ? "Saving..." : editing ? "Save changes" : "Add item"}</Button>
              {editing ? <Button type="button" variant="secondary" onClick={cancelEditing}>Cancel</Button> : null}
            </div>
          </form>
          </div>

          <div className="space-y-4">
            <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Best-selling items</h2>
              <div className="mt-3 grid gap-2">
                {analytics.bestSellers.length ? analytics.bestSellers.map((item) => (
                  <div key={item.name} className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm">
                    <span className="font-semibold">{item.name}</span>
                    <span>{item.quantity} sold</span>
                  </div>
                )) : <p className="text-sm text-slate-500">Best sellers appear after orders are placed.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Menu items</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {searchQuery.trim() ? `${filteredItems.length} result${filteredItems.length === 1 ? "" : "s"} from ${items.length} items.` : `${items.length} item${items.length === 1 ? "" : "s"}.`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <label className="block text-sm font-semibold">
                    <span className="sr-only">Search menu items</span>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search menu items"
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-3 sm:w-64"
                    />
                  </label>
                  {searchQuery ? (
                    <Button type="button" variant="secondary" onClick={() => setSearchQuery("")}>
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {filteredItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          {item.imageUrl ? (
                            // Admin thumbnails use the same hosted menu photo URL saved on the item.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="grid h-full place-items-center text-xs text-slate-400">No photo</div>
                          )}
                        </div>
                        <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge>{categoryById.get(item.categoryId)?.name ?? "Uncategorized"}</Badge>
                          {item.isSoldOut ? <Badge tone="danger">Sold out</Badge> : <Badge tone="good">Available</Badge>}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                        <p className="mt-1 font-semibold text-teal-800">{formatMoney(item.priceCents, settings.currency)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => beginEditing(item)}>Edit</Button>
                        <Button variant="secondary" onClick={() => patchItem(item.id, { isSoldOut: !item.isSoldOut })}>
                          {item.isSoldOut ? "Mark available" : "Sold out"}
                        </Button>
                        <Button variant="danger" onClick={() => deleteItem(item.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!filteredItems.length ? (
                  <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    {items.length ? "No menu items match your search." : "No menu items yet. Add your first item from the form."}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function makeOptionId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyOption(): EditableOption {
  return { id: makeOptionId(), name: "", price: "" };
}

function emptyOptionGroup(): EditableOptionGroup {
  return {
    id: makeOptionId(),
    name: "",
    required: false,
    multiple: false,
    options: [emptyOption()],
  };
}

function presetOptionGroup(kind: "size" | "sugar" | "addons"): EditableOptionGroup {
  if (kind === "size") {
    return {
      id: makeOptionId(),
      name: "Size",
      required: true,
      multiple: false,
      options: [
        { id: makeOptionId(), name: "Regular", price: "" },
        { id: makeOptionId(), name: "Large", price: "20.00" },
      ],
    };
  }
  if (kind === "sugar") {
    return {
      id: makeOptionId(),
      name: "Sugar level",
      required: true,
      multiple: false,
      options: [
        { id: makeOptionId(), name: "25%", price: "" },
        { id: makeOptionId(), name: "50%", price: "" },
        { id: makeOptionId(), name: "100%", price: "" },
      ],
    };
  }
  return {
    id: makeOptionId(),
    name: "Add-ons",
    required: false,
    multiple: true,
    options: [
      { id: makeOptionId(), name: "Pearls", price: "15.00" },
      { id: makeOptionId(), name: "Cream cheese", price: "25.00" },
    ],
  };
}

function parseEditableOptionGroups(value: string): EditableOptionGroup[] {
  try {
    const parsed = JSON.parse(value || "[]") as {
      name?: string;
      required?: boolean;
      maxChoices?: number;
      options?: { name?: string; priceCents?: number }[];
    }[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((group) => ({
      id: makeOptionId(),
      name: String(group.name ?? ""),
      required: Boolean(group.required),
      multiple: Number(group.maxChoices ?? 1) > 1,
      options: Array.isArray(group.options) && group.options.length
        ? group.options.map((option) => ({
            id: makeOptionId(),
            name: String(option.name ?? ""),
            price: option.priceCents ? (Number(option.priceCents) / 100).toFixed(2) : "",
          }))
        : [emptyOption()],
    }));
  } catch {
    return [];
  }
}

function buildOptionGroupsJson(groups: EditableOptionGroup[]): { ok: true; value: string } | { ok: false; error: string } {
  const cleaned = [];
  for (const group of groups) {
    const groupHasContent = group.name.trim() || group.options.some((option) => option.name.trim() || option.price.trim());
    if (!groupHasContent) continue;
    if (!group.name.trim()) return { ok: false, error: "Each customization group needs a name." };

    const options = [];
    for (const option of group.options) {
      const optionHasContent = option.name.trim() || option.price.trim();
      if (!optionHasContent) continue;
      if (!option.name.trim()) return { ok: false, error: `Add a name for every option in ${group.name}.` };
      const price = Number(option.price || 0);
      if (!Number.isFinite(price) || price < 0) return { ok: false, error: `Enter a valid price for ${option.name}.` };
      options.push({ name: option.name.trim(), priceCents: Math.round(price * 100) });
    }

    if (!options.length) return { ok: false, error: `${group.name} needs at least one option.` };
    cleaned.push({
      name: group.name.trim(),
      required: group.required,
      maxChoices: group.multiple ? Math.max(2, options.length) : 1,
      options,
    });
  }
  return { ok: true, value: JSON.stringify(cleaned) };
}

function CustomizationBuilder({
  groups,
  currency,
  onChange,
}: {
  groups: EditableOptionGroup[];
  currency: string;
  onChange: (groups: EditableOptionGroup[]) => void;
}) {
  function updateGroup(id: string, patch: Partial<EditableOptionGroup>) {
    onChange(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)));
  }

  function updateOption(groupId: string, optionId: string, patch: Partial<EditableOption>) {
    onChange(groups.map((group) => (
      group.id === groupId
        ? { ...group, options: group.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option)) }
        : group
    )));
  }

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Add-ons and customizations</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Use this for sizes, sugar level, ice, toppings, or paid extras. Customers will see these choices before adding to cart.
          </p>
        </div>
        <Button type="button" variant="secondary" className="min-h-10 px-3 py-2 text-sm" onClick={() => onChange([...groups, emptyOptionGroup()])}>
          Add group
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ["size", "Size"] as const,
          ["sugar", "Sugar"] as const,
          ["addons", "Add-ons"] as const,
        ].map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            onClick={() => onChange([...groups, presetOptionGroup(kind)])}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-800"
          >
            + {label}
          </button>
        ))}
      </div>

      {groups.length ? (
        <div className="mt-4 grid gap-3">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                <label className="block text-sm font-semibold">
                  Group name
                  <input
                    value={group.name}
                    onChange={(event) => updateGroup(group.id, { name: event.target.value })}
                    className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                    placeholder={groupIndex === 0 ? "Size" : "Add-ons"}
                  />
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={(event) => updateGroup(group.id, { required: event.target.checked })}
                    className="size-5"
                  />
                  Required
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={group.multiple}
                    onChange={(event) => updateGroup(group.id, { multiple: event.target.checked })}
                    className="size-5"
                  />
                  Multiple choices
                </label>
              </div>

              <div className="mt-3 grid gap-2">
                {group.options.map((option) => (
                  <div key={option.id} className="grid gap-2 sm:grid-cols-[1fr_112px_40px] sm:items-center">
                    <input
                      value={option.name}
                      onChange={(event) => updateOption(group.id, option.id, { name: event.target.value })}
                      className="min-h-11 rounded-lg border border-slate-300 px-3"
                      placeholder="Option name, e.g. Large"
                    />
                    <input
                      value={option.price}
                      onChange={(event) => updateOption(group.id, option.id, { price: event.target.value })}
                      type="number"
                      min="0"
                      step="0.01"
                      className="min-h-11 rounded-lg border border-slate-300 px-3"
                      placeholder="+0.00"
                    />
                    <button
                      type="button"
                      onClick={() => updateGroup(group.id, { options: group.options.filter((item) => item.id !== option.id) })}
                      disabled={group.options.length === 1}
                      className="min-h-10 rounded-lg text-sm font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30"
                      aria-label={`Remove ${option.name || "option"}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="min-h-10 px-3 py-2 text-sm" onClick={() => updateGroup(group.id, { options: [...group.options, emptyOption()] })}>
                  Add option
                </Button>
                <Button type="button" variant="ghost" className="min-h-10 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50" onClick={() => onChange(groups.filter((item) => item.id !== group.id))}>
                  Remove group
                </Button>
              </div>

              <div className="mt-3 rounded-lg bg-[#f7f5ef] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Customer preview</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-semibold">{group.name || "Group name"}</span>
                  <span className="text-xs text-slate-500">{group.required ? "Required" : group.multiple ? "Choose any" : "Optional"}</span>
                </div>
                <div className="mt-2 grid gap-2">
                  {group.options.map((option) => (
                    <div key={option.id} className="flex min-h-9 items-center justify-between rounded-lg border border-[#e2ded4] bg-white px-3 text-sm">
                      <span>{option.name || "Option name"}</span>
                      <span className="text-slate-500">
                        {Number(option.price || 0) > 0 ? `+${formatMoney(Math.round(Number(option.price) * 100), currency)}` : "Included"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No customizations yet. Use a preset for common choices like size, sugar level, or add-ons.
        </p>
      )}
    </section>
  );
}

function CategoryManager({
  categories,
  itemCounts,
  onCategoriesChange,
}: {
  categories: Category[];
  itemCounts: Map<string, number>;
  onCategoriesChange: (updater: (current: Category[]) => Category[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(() =>
    String(Math.max(0, ...categories.map((category) => category.sortOrder)) + 1),
  );
  const [categoryError, setCategoryError] = useState("");
  const [categoryPending, startCategoryTransition] = useTransition();

  function upsertSortedCategory(savedCategory: Category) {
    onCategoriesChange((current) => {
      const exists = current.some((category) => category.id === savedCategory.id);
      const next = exists
        ? current.map((category) => (category.id === savedCategory.id ? savedCategory : category))
        : [...current, savedCategory];
      return next.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    });
  }

  function addCategory() {
    setCategoryError("");
    const payload = {
      name: newName.trim(),
      sortOrder: Math.round(Number(newSortOrder) || 0),
    };

    startCategoryTransition(async () => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { category?: Category; error?: string };
      if (!response.ok || !result.category) {
        setCategoryError(result.error ?? "Could not add category.");
        return;
      }
      upsertSortedCategory(result.category);
      setNewName("");
      setNewSortOrder(String(result.category.sortOrder + 1));
    });
  }

  function saveCategory(id: string, formData: FormData) {
    setCategoryError("");
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      sortOrder: Math.round(Number(formData.get("sortOrder")) || 0),
    };

    startCategoryTransition(async () => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { category?: Category; error?: string };
      if (!response.ok || !result.category) {
        setCategoryError(result.error ?? "Could not save category.");
        return;
      }
      upsertSortedCategory(result.category);
    });
  }

  function deleteCategory(category: Category) {
    setCategoryError("");
    const count = itemCounts.get(category.id) ?? 0;
    if (count > 0) {
      setCategoryError(`Move or delete ${count} menu item${count === 1 ? "" : "s"} before deleting ${category.name}.`);
      return;
    }
    if (!window.confirm(`Delete ${category.name}?`)) return;

    startCategoryTransition(async () => {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setCategoryError(result?.error ?? "Could not delete category.");
        return;
      }
      onCategoriesChange((current) => current.filter((item) => item.id !== category.id));
    });
  }

  return (
    <section className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Categories</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Add, rename, and reorder the groups customers see on the menu.</p>
      {categoryError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{categoryError}</p> : null}

      <div className="mt-4 grid gap-3">
        <div className="grid gap-2 rounded-lg bg-slate-50 p-3">
          <label className="block text-sm font-semibold">
            New category
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
              placeholder="Breakfast, Coffee, Specials"
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="block text-sm font-semibold">
              Sort
              <input
                type="number"
                min="0"
                value={newSortOrder}
                onChange={(event) => setNewSortOrder(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
              />
            </label>
            <Button
              type="button"
              className="self-end"
              disabled={categoryPending || newName.trim().length < 2}
              onClick={addCategory}
            >
              Add
            </Button>
          </div>
        </div>

        {categories.map((category) => {
          const count = itemCounts.get(category.id) ?? 0;
          return (
            <form key={category.id} action={(formData) => saveCategory(category.id, formData)} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_88px]">
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Name
                  <input
                    name="name"
                    defaultValue={category.name}
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold normal-case tracking-normal text-slate-900"
                    required
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Sort
                  <input
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue={category.sortOrder}
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold normal-case tracking-normal text-slate-900"
                    required
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-500">{count} item{count === 1 ? "" : "s"}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={categoryPending}>
                    Save
                  </Button>
                  <Button type="button" variant="danger" disabled={categoryPending || count > 0} onClick={() => deleteCategory(category)}>
                    Delete
                  </Button>
                </div>
              </div>
            </form>
          );
        })}
      </div>
    </section>
  );
}

function StaffPinManager() {
  const [message, setMessage] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinFormVersion, setPinFormVersion] = useState(0);
  const [pinPending, startPinTransition] = useTransition();

  function savePins(formData: FormData) {
    setMessage("");
    setPinError("");
    const payload = {
      cashierPin: String(formData.get("cashierPin") ?? ""),
      kitchenPin: String(formData.get("kitchenPin") ?? ""),
      adminPin: String(formData.get("adminPin") ?? ""),
    };

    startPinTransition(async () => {
      const response = await fetch("/api/admin/staff-credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { error?: string; updatedRoles?: string[] } | null;
      if (!response.ok) {
        setPinError(result?.error ?? "Could not update staff PINs.");
        return;
      }
      setMessage(`Updated ${result?.updatedRoles?.join(", ") || "staff"} PINs.`);
      setPinFormVersion((current) => current + 1);
    });
  }

  return (
    <form key={pinFormVersion} action={savePins} className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Staff PINs</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">PINs are scoped to this restaurant only. Leave a field blank to keep its current PIN.</p>
      {pinError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{pinError}</p> : null}
      {message ? <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p> : null}
      <div className="mt-4 grid gap-3">
        <Field name="cashierPin" label="New cashier PIN" defaultValue="" />
        <Field name="kitchenPin" label="New kitchen PIN" defaultValue="" />
        <Field name="adminPin" label="New admin PIN" defaultValue="" />
      </div>
      <Button className="mt-5" disabled={pinPending}>{pinPending ? "Saving..." : "Update PINs"}</Button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="mt-4 block text-sm font-semibold">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
        required={name !== "imageUrl" && !name.endsWith("Pin")}
      />
    </label>
  );
}

function BrandingImageField({
  label,
  name,
  value,
  previewClassName,
  isUploading,
  onUpload,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  previewClassName: string;
  isUploading: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="block text-sm font-semibold">
        {label}
        <input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Upload or paste image URL"
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
        />
      </label>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {value ? (
          // Admin previews external Cloudinary/menu image URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={previewClassName} />
        ) : (
          <div className="grid h-28 place-items-center text-sm font-semibold text-slate-400">No image yet</div>
        )}
      </div>
      <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 transition hover:border-teal-600">
        {isUploading ? "Uploading..." : "Upload image"}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isUploading} onChange={onUpload} />
      </label>
    </div>
  );
}
