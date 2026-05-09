import Link from "next/link";

const links = [
  { href: "/r/g-cafe", label: "Customer QR menu", description: "Browse, customize, and place a counter-pay order." },
  { href: "/staff/cashier", label: "Cashier dashboard", description: "Confirm payment, cancel orders, and search numbers." },
  { href: "/staff/kitchen", label: "Kitchen dashboard", description: "Run the paid-order preparation queue." },
  { href: "/admin", label: "Owner admin", description: "Manage menu, sold-out state, and basic analytics." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] px-5 py-8 text-[#16211f]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            OrderKo.com
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] text-[#10201d] sm:text-7xl">
                QR ordering that keeps the counter and kitchen moving.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#50635f]">
                A lightweight operating system for cafes, takeaway shops, milk tea stores,
                food stalls, and small restaurants that need speed without enterprise clutter.
              </p>
            </div>
            <div className="grid gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[#132522]">{link.label}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#63746f]">{link.description}</p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-full bg-[#eef8f5] text-xl text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 rounded-lg border border-[#dbe4df] bg-white p-5 text-sm text-[#50635f]">
          Customers never need an account. Staff areas are protected and should use restaurant-specific PINs before launch.
        </div>
      </section>
    </main>
  );
}
