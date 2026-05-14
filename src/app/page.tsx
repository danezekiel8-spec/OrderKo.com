import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingLeadForm } from "@/components/landing-lead-form";

const siteUrl = process.env.ORDERKO_QR_BASE_URL?.replace(/\/$/, "") || "https://orderko.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OrderKo.com | QR Ordering for Small Restaurants",
  description:
    "OrderKo helps cafes, food stalls, takeaway shops, and small restaurants reduce queues, cut order mistakes, and run cashier and kitchen workflows without expensive kiosk hardware.",
  keywords: [
    "QR ordering for restaurants",
    "restaurant ordering system",
    "contactless menu system",
    "kitchen display system",
    "cashier ordering software",
    "Philippines restaurant POS",
  ],
  openGraph: {
    title: "OrderKo.com | Scan. Order. Pay. Bon Appetit.",
    description: "A lightweight QR ordering and operations platform for small food businesses.",
    type: "website",
    images: [{ url: "/assets/orderko-landing-hero.jpg", alt: "Cafe drinks ready for QR ordering" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OrderKo.com | QR Ordering for Small Restaurants",
    description: "Reduce queues, wrong orders, and counter pressure with lightweight QR ordering.",
    images: ["/assets/orderko-landing-hero.jpg"],
  },
};

const features = [
  ["Affordable", "Start with a simple monthly plan built for small food businesses."],
  ["No expensive hardware installation", "Use QR ordering instead of buying costly kiosk equipment upfront."],
  ["Convenient for customers", "Customers scan, browse, and order without downloading an app."],
  ["More productive staff", "Cashier and kitchen teams see clearer orders during busy hours."],
  ["Customizable menu", "You control categories, prices, photos, add-ons, and sold-out items."],
];

const rollout = [
  ["Scan QR", "Customer opens the menu instantly."],
  ["Place order", "They browse, customize, and submit."],
  ["Pay counter", "Cashier confirms payment before kitchen work starts."],
  ["Kitchen updates", "Customer sees the order move toward ready."],
];

const plans = [
  {
    name: "Starter",
    label: "For first pilots",
    description: "QR menu, ordering, cashier, kitchen, and admin tools.",
    items: ["Public QR ordering", "Counter payment workflow", "Menu and sold-out controls"],
  },
  {
    name: "Growth",
    label: "Recommended",
    description: "A stronger setup for busy cafes and takeaway counters.",
    items: ["Everything in Starter", "Kiosk-ready ordering", "Setup support and launch guidance"],
    featured: true,
  },
  {
    name: "Pilot / Custom",
    label: "For rollout help",
    description: "A practical launch plan for restaurants testing OrderKo live.",
    items: ["QR signage guidance", "Staff onboarding notes", "Custom setup discussion"],
  },
];

function CheckMark() {
  return (
    <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[#0f766e] text-sm font-black text-white">
      ✓
    </span>
  );
}

function DemoPlaceholder() {
  const flow = ["Scan QR", "Place order", "Pay counter", "Kitchen prepares"];

  return (
    <div className="landing-video-placeholder overflow-hidden rounded-[1.75rem] border border-[#dbe4df] bg-[#132522] p-3 shadow-2xl shadow-[#10201d]/15">
      <div className="grid aspect-video place-items-center rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.35),transparent_36%),linear-gradient(135deg,#132522,#28443f)] p-5 text-center text-white">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b7e4d7]">Product walkthrough</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            See the full customer, cashier, and kitchen flow.
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            {flow.map((item, index) => (
              <div
                key={item}
                className="landing-flow-step rounded-2xl bg-white/10 px-4 py-3 text-sm font-black backdrop-blur"
                style={{ animationDelay: `${index * 160}ms` }}
              >
                {item}
              </div>
            ))}
          </div>
          <Link href="#demo" className="landing-hover-lift mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-[#17211f]">
            Request demo
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#16211f]">
      <header className="border-b border-white/35 bg-[#fffaf1]/58 px-5 py-2 shadow-sm shadow-[#10201d]/5 backdrop-blur-xl sm:px-8 lg:px-10">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="landing-hover-lift inline-flex items-center gap-3 text-black">
            <Image
              src="/assets/orderko-logo.png"
              alt="OrderKo"
              width={112}
              height={112}
              priority
              className="size-11 rounded-xl object-cover shadow-md shadow-[#10201d]/12 sm:size-12"
            />
            <span className="wonder-glow-style text-xl leading-none sm:text-2xl">ORDERKO</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs font-bold text-black sm:gap-x-6 sm:text-sm">
            <Link href="#demo" className="landing-hover-lift">
              Request demo
            </Link>
            <Link href="#demo" className="landing-hover-lift">
              Plans
            </Link>
            <Link href="#demo" className="landing-hover-lift">
              Contact us
            </Link>
            <Link href="/staff/login" className="landing-hover-lift">
              Staff login
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/orderko-landing-hero.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,16,0.88),rgba(11,18,16,0.64),rgba(11,18,16,0.26))]" />
        <div className="relative mx-auto grid min-h-[78svh] max-w-7xl content-center px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="max-w-4xl text-white">
            <p className="landing-fade-in text-sm font-black uppercase tracking-[0.22em] text-[#b7e4d7]">
              QR ordering for small restaurants
            </p>
            <h1 className="landing-fade-in landing-fade-delay-1 mt-5 text-5xl font-black leading-[0.96] sm:text-7xl lg:text-8xl">
              Scan. Order. Pay. <span className="wonder-glow-style font-normal">Bon Appetit.</span>
            </h1>
            <p className="landing-fade-in landing-fade-delay-2 mt-6 max-w-2xl text-lg font-medium leading-8 text-white/88 sm:text-xl">
              Say goodbye to long queues and costly kiosks. OrderKo&apos;s QR-based ordering speeds
              up service for cafes, takeaway shops, milk tea stores and food stalls.
            </p>
            <div className="landing-fade-in landing-fade-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#demo" className="landing-hover-lift rounded-full bg-[#0f766e] px-7 py-4 text-center text-base font-black text-white shadow-xl shadow-black/20 transition hover:bg-[#0d5f59]">
                Request demo
              </Link>
              <Link href="/r/g-cafe" className="landing-hover-lift rounded-full bg-white/94 px-7 py-4 text-center text-base font-black text-[#17211f] transition hover:bg-white">
                Explore customer experience
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Product demo</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
                One ordering flow from phone to counter to kitchen.
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-[#5f6c68]">
              A short video will sit here. Until then, the flow stays clear for restaurant owners.
            </p>
          </div>
          <DemoPlaceholder />
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Why Use OrderKo?</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Built around the work small restaurants repeat every day.
            </h2>
          </div>
          <div className="divide-y divide-[#e7ece8]">
            {features.map(([title, text], index) => (
              <div key={title} className="landing-benefit-card landing-hover-lift flex gap-4 py-5" style={{ animationDelay: `${index * 90}ms` }}>
                <CheckMark />
                <div>
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-1 leading-7 text-[#5f6c68]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#17302b] px-5 py-16 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b7e4d7]">Simple rollout</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Scan to order. Pay at the counter. Pick up with confidence.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {rollout.map(([title, text], index) => (
                <div key={title} className="flex gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-[#17302b]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="mt-1 leading-7 text-white/72">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Plans and demo</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Affordable monthly plans with no costly hardware setup.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-[1.35rem] border p-5 ${
                  plan.featured
                    ? "border-[#0f766e] bg-[#edfbf7] shadow-xl shadow-[#0f766e]/10"
                    : "border-[#dfe8e2] bg-[#fbfaf7]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0f766e]">{plan.label}</p>
                    <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-full bg-[#0f766e] px-3 py-1 text-xs font-black text-white">Recommended</span>
                  ) : null}
                </div>
                <p className="mt-4 min-h-14 leading-7 text-[#5f6c68]">{plan.description}</p>
                <p className="mt-5 text-3xl font-black">Contact us</p>
                <p className="text-sm font-semibold text-[#5f6c68]">for pilot pricing</p>
                <div className="mt-5 space-y-3">
                  {plan.items.map((item) => (
                    <div key={item} className="flex gap-3 text-sm font-semibold text-[#21322f]">
                      <span className="text-[#0f766e]">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-8 rounded-[1.75rem] border border-[#dfe8e2] bg-[#fbfaf7] p-5 shadow-xl shadow-[#10201d]/8 lg:grid-cols-[0.85fr_1.15fr] lg:p-7">
            <div>
              <h3 className="text-2xl font-black">Interested? Let&apos;s get in touch.</h3>
              <p className="mt-3 leading-7 text-[#5f6c68]">
                Share your details and we will contact you about setup, pricing, and a pilot plan.
              </p>
            </div>
            <LandingLeadForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dfe8e2] bg-[#f7f4ee] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-semibold text-[#5f6c68] sm:flex-row sm:items-center sm:justify-between">
          <p>OrderKo.com - Lightweight restaurant ordering for small food businesses.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-[#0f766e]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#0f766e]">Terms</Link>
            <a href="mailto:support@orderko.com" className="hover:text-[#0f766e]">support@orderko.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
