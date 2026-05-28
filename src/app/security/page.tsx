import type { Metadata } from "next";
import Link from "next/link";
import { OrderKoBrand } from "@/components/orderko-brand";

export const metadata: Metadata = {
  title: "Security | OrderKo.com",
  description: "How OrderKo protects restaurant ordering, staff access, menu management, and launch operations.",
  alternates: {
    canonical: "/security",
  },
};

const protections = [
  {
    title: "Restaurant-scoped data",
    body: "Menus, orders, staff credentials, and operational controls are tied to a restaurant record so each business stays separated.",
  },
  {
    title: "Protected staff areas",
    body: "Cashier, kitchen, admin, and super-admin screens use server-side session checks instead of being public dashboards.",
  },
  {
    title: "Hashed staff PINs",
    body: "Staff PINs are stored as hashes, not readable values, and new PINs must avoid common weak patterns.",
  },
  {
    title: "Login throttling",
    body: "Staff and super-admin login attempts are rate limited to reduce brute-force guessing risk.",
  },
  {
    title: "Safer order submission",
    body: "Customer order creation is validated, duplicate submissions are blocked, and submission bursts are rate limited.",
  },
  {
    title: "Production health checks",
    body: "Public health checks confirm service status without exposing database connection details in production responses.",
  },
];

const roadmap = ["Owner accounts with stronger identity controls", "Two-factor authentication for operators", "Expanded audit logs for sensitive admin changes", "Formal incident response and security review process"];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#16211f] sm:px-8">
      <article className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="inline-flex">
          <OrderKoBrand />
        </Link>
        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Security foundation</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Built to protect real restaurant operations.</h1>
          <p className="mt-5 leading-8 text-[#5f6c68]">
            OrderKo is designed so small restaurants can accept QR and kiosk orders without exposing staff tools,
            credentials, or operational data to customers.
          </p>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {protections.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#dfe8e2] bg-[#fbfaf6] p-5">
              <h2 className="text-lg font-black">{item.title}</h2>
              <p className="mt-2 leading-7 text-[#5f6c68]">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-[#dfe8e2] bg-[#10201d] p-6 text-white">
          <h2 className="text-2xl font-black">Security roadmap</h2>
          <p className="mt-3 leading-8 text-white/75">
            OrderKo already has a practical MVP security foundation. These are the next upgrades planned as more
            restaurants join and operational risk increases.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {roadmap.map((item) => (
              <li key={item} className="rounded-2xl bg-white/10 p-4 font-semibold text-white/90">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
