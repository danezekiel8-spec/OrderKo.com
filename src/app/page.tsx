import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingLeadForm } from "@/components/landing-lead-form";
import { LandingPricingPlans } from "@/components/landing-pricing-plans";

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

function CheckMark() {
  return (
    <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[#0f766e] text-sm font-black text-white">
      ✓
    </span>
  );
}

export default function Home() {
  return (
    <main className="landing-page min-h-screen bg-[#f7f4ee] text-[#16211f]">
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
            <Link href="#contact" className="landing-hover-lift">
              Request demo
            </Link>
            <Link href="#plans" className="landing-hover-lift">
              Plans
            </Link>
            <Link href="#contact" className="landing-hover-lift">
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
              <Link href="#contact" className="landing-hover-lift rounded-full bg-[#0f766e] px-7 py-4 text-center text-base font-black text-white shadow-xl shadow-black/20 transition hover:bg-[#0d5f59]">
                Request demo
              </Link>
              <Link href="/r/g-cafe" className="landing-hover-lift rounded-full bg-white/94 px-7 py-4 text-center text-base font-black text-[#17211f] transition hover:bg-white">
                Explore customer experience
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section bg-white/72 px-5 py-16 backdrop-blur-xl sm:px-8 lg:px-10">
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

      <section className="landing-section bg-[#17302b] px-5 py-16 text-white sm:px-8 lg:px-10">
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

      <section id="plans" className="landing-section scroll-mt-20 bg-white/72 px-5 py-16 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Plans and contact</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Affordable monthly plans with no costly hardware setup.
            </h2>
          </div>
          <LandingPricingPlans />
          <div id="contact" className="mt-8 scroll-mt-24 grid gap-8 rounded-[1.75rem] border border-white/70 bg-white/58 p-5 shadow-2xl shadow-[#10201d]/10 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-7">
            <div>
              <h3 className="text-2xl font-black">Interested? Let&apos;s get in touch.</h3>
              <p className="mt-3 leading-7 text-[#5f6c68]">
                Share your details and we will contact you about setup, pricing, and a pilot plan.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#5f6c68]">
                You can also email{" "}
                <a className="text-[#0f766e] underline-offset-4 hover:underline" href="mailto:hello.orderko@gmail.com">
                  hello.orderko@gmail.com
                </a>
                .
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
            <a href="mailto:hello.orderko@gmail.com" className="hover:text-[#0f766e]">hello.orderko@gmail.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
