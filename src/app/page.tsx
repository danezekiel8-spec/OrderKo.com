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
    description:
      "A lightweight QR ordering and operations platform for small food businesses.",
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

const benefits = [
  {
    label: "Affordable",
    text: "Start with a simple monthly plan built for small food businesses.",
  },
  {
    label: "No expensive hardware installation",
    text: "Use QR ordering instead of buying costly kiosk equipment upfront.",
  },
  {
    label: "Convenient for customers",
    text: "Customers scan, browse, and order without downloading an app.",
  },
  {
    label: "More productive staff",
    text: "Cashier and kitchen teams see clearer orders during busy hours.",
  },
  {
    label: "Customizable menu",
    text: "You control what is in the menu, including categories, prices, photos, and sold-out items.",
  },
];

const steps = [
  "Customer scans the QR code.",
  "They browse, customize, and place the order.",
  "Cashier confirms payment at the counter.",
  "Kitchen prepares and updates the order status.",
];

function VideoPlaceholder() {
  const flow = ["Scan QR", "Place order", "Pay counter", "Kitchen prepares"];

  return (
    <div className="landing-video-placeholder overflow-hidden rounded-3xl border border-[#d9e1dc] bg-[#17211f] p-4 shadow-2xl shadow-[#10201d]/15">
      <div className="grid aspect-video place-items-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.35),transparent_36%),linear-gradient(135deg,#132522,#26433d)] p-5 text-center text-white">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b7e4d7]">Video coming soon</p>
          <h3 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Watch OrderKo move orders from QR scan to kitchen queue.
          </h3>
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
          <Link
            href="#demo"
            className="landing-hover-lift mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-[#17211f]"
          >
            See it in action
          </Link>
        </div>
      </div>
    </div>
  );
}
export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#16211f]">
      <section className="relative isolate min-h-[82svh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/orderko-landing-hero.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,16,0.86),rgba(11,18,16,0.62),rgba(11,18,16,0.28))]" />
        <div className="relative mx-auto flex min-h-[82svh] max-w-7xl flex-col justify-between px-5 py-6 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between gap-4 text-white">
            <Link href="/" className="landing-hover-lift inline-flex items-center gap-3">
            <Image
              src="/assets/orderko-logo.png"
              alt="OrderKo"
              width={112}
              height={112}
                priority
                className="size-16 rounded-2xl object-cover shadow-lg shadow-black/20 sm:size-20"
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link href="#demo" className="landing-hover-lift rounded-full bg-white px-4 py-2 text-sm font-bold text-[#17211f]">
                Request demo
              </Link>
              <Link href="/staff/login" className="landing-hover-lift hidden rounded-full border border-white/40 px-4 py-2 text-sm font-bold sm:inline-flex">
                Staff login
              </Link>
            </div>
          </nav>
          <div className="max-w-4xl py-14 text-white sm:py-20">
            <p className="landing-fade-in text-sm font-bold uppercase tracking-[0.22em] text-[#b7e4d7]">
              QR ordering for small restaurants
            </p>
            <h1 className="landing-fade-in landing-fade-delay-1 mt-5 max-w-4xl text-5xl font-black leading-[0.96] sm:text-7xl lg:text-8xl">
              Scan. Order. Pay. <span className="wonder-glow-style font-normal">Bon Appetit.</span>
            </h1>
            <p className="landing-fade-in landing-fade-delay-2 mt-6 max-w-2xl text-lg font-medium leading-8 text-white/86 sm:text-xl">
              Say goodbye to long queues and costly kiosks. OrderKo&apos;s QR-based ordering speeds
              up service for cafes, takeaway shops, milk tea stores and food stalls.
            </p>
            <div className="landing-fade-in landing-fade-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#demo" className="landing-hover-lift rounded-full bg-[#0f766e] px-7 py-4 text-center text-base font-black text-white shadow-xl shadow-black/20 transition hover:bg-[#0d5f59]">
                Get started
              </Link>
              <Link href="/r/g-cafe" className="landing-hover-lift rounded-full bg-white/94 px-7 py-4 text-center text-base font-black text-[#17211f] transition hover:bg-white">
                Explore customer experience
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f4ee] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f766e]">How OrderKo works</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              A quick walkthrough video will go here.
            </h2>
          </div>
          <VideoPlaceholder />
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">Why Use OrderKo?</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Simple ordering technology for real restaurant work.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <article
                key={benefit.label}
                className="landing-benefit-card landing-hover-lift rounded-2xl border border-[#e2e8e3] bg-[#fbfaf7] p-5"
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#0f766e] text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-black">{benefit.label}</h3>
                <p className="mt-2 leading-7 text-[#5f6c68]">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#17302b] px-5 py-14 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b7e4d7]">Simple rollout</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Scan to order. Pay at the counter. Pick up with confidence.
            </h2>
          </div>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-[#17302b]">
                  {index + 1}
                </span>
                <p className="text-lg font-bold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-white px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f766e]">Pricing and demo</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Affordable monthly plans for small restaurants.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#5f6c68]">
              No hidden hardware fees, no long enterprise rollout, and no customer app download.
              Tell us about your restaurant and we will help you set up the first pilot.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-bold text-[#21322f]">
              <div className="rounded-xl bg-[#f6f8f5] p-4">Starter: QR menu, ordering, cashier, kitchen, and admin tools.</div>
              <div className="rounded-xl bg-[#f6f8f5] p-4">Pilot support: setup help, QR guidance, and staff onboarding notes.</div>
            </div>
          </div>
          <div className="rounded-3xl border border-[#dfe8e2] bg-[#fbfaf7] p-5 shadow-xl shadow-[#10201d]/8 sm:p-7">
            <h3 className="text-2xl font-black">Interested? Let&apos;s get in touch.</h3>
            <p className="mt-2 leading-7 text-[#5f6c68]">
              Share your details and we will contact you about setup, pricing, and a pilot plan.
            </p>
            <div className="mt-6">
              <LandingLeadForm />
            </div>
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
