export function formatMoney(cents: number, currency = "NZD") {
  const locale = currency === "PHP" ? "en-PH" : "en-NZ";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
