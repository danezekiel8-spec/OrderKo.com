import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingLeadForm } from "@/components/landing-lead-form";
import { LandingPricingPlans } from "@/components/landing-pricing-plans";

const siteUrl = process.env.ORDERKO_QR_BASE_URL?.replace(/\/$/, "") || "https://orderko.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OrderKo - QR Ordering for Small Restaurants",
  description:
    "OrderKo helps cafes, takeaway shops, milk tea stores, and food stalls reduce queues, cut wrong orders, and serve customers faster with QR ordering and kiosk workflows.",
  keywords: [
    "QR ordering for restaurants",
    "restaurant ordering system",
    "kiosk ordering",
    "cashier dashboard",
    "kitchen display system",
    "small restaurant software",
  ],
  openGraph: {
    title: "OrderKo - QR Ordering for Small Restaurants",
    description: "Reduce queues, cut wrong orders, and serve customers faster without expensive kiosk hardware.",
    type: "website",
    images: [{ url: "/assets/orderko-landing-hero.jpg", alt: "Cafe drinks ready for QR ordering" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OrderKo - QR Ordering for Small Restaurants",
    description: "Lightweight QR ordering and kiosk workflows for small food businesses.",
    images: ["/assets/orderko-landing-hero.jpg"],
  },
};

const painPoints = [
  "Long queues at the counter",
  "Cashier pressure during peak hours",
  "Missed notes and customizations",
  "Kitchen confusion during busy service",
];

const values = [
  ["Reduce counter queues", "Let customers order before reaching the cashier."],
  ["Cut wrong orders", "Customers enter notes and customizations themselves."],
  ["Speed up service", "Staff sees clearer order details faster."],
  ["Avoid kiosk hardware costs", "Use phones, tablets, or normal browsers."],
  ["Control your menu anytime", "Update prices, photos, categories, and sold-out items."],
  ["Easy for small teams", "Simple workflows for cashier, kitchen, and admin."],
];

const perfectFor = ["Cafes", "Milk tea stores", "Takeaway shops", "Food stalls", "Small restaurants", "Quick-service counters"];

const steps = [
  ["Scan or tap kiosk", "Customer opens the menu instantly."],
  ["Place order", "They browse, customize, and submit."],
  ["Pay at counter", "Cashier confirms payment."],
  ["Kitchen prepares", "Paid orders move to the kitchen."],
  ["Pickup is clear", "Customer sees when the order is ready."],
];

const features = [
  "QR customer ordering",
  "Kiosk mode",
  "Cashier dashboard",
  "Kitchen dashboard",
  "Menu management",
  "Sold-out controls",
  "Order tracking",
  "Pay-at-counter workflow",
];

const demos = [
  ["Customer Ordering", "Browse the phone ordering experience customers see.", "/r/g-cafe"],
  ["In-Store Kiosk", "Try the touchscreen ordering flow for a counter or tablet setup.", "/k/g-cafe"],
  ["Staff Operations", "View the entry point for cashier, kitchen, and admin workflows.", "/staff/login"],
];

const setupSteps = [
  "Set up your restaurant profile",
  "Add your first menu and categories",
  "Generate your QR code",
  "Walk staff through cashier and kitchen flow",
  "Run a test order before launch",
];

const faqs = [
  ["Do customers need to download an app?", "No. Customers scan a QR code and order directly from their browser."],
  ["Do we need expensive kiosk hardware?", "No. OrderKo can run on phones, tablets, or standard web browsers."],
  ["Can customers still pay at the counter?", "Yes. OrderKo is built around simple pay-at-counter workflows."],
  ["What if an item is sold out?", "Staff can mark items as sold out so customers stop ordering unavailable food."],
  ["Is this only for big restaurants?", "No. OrderKo is designed for cafes, takeaway shops, milk tea stores, food stalls, and small restaurants."],
  ["Can we try it first?", "Yes. Request a pilot demo and we will help you test if OrderKo fits your workflow."],
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f766e]">{children}</p>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`landing-hover-lift rounded-[1.5rem] border border-white/70 bg-white/62 p-5 shadow-xl shadow-[#10201d]/7 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main className="landing-page min-h-screen bg-[#f7f4ee] text-[#16211f]">
      <header className="sticky top-0 z-40 border-b border-white/35 bg-[#fffaf1]/64 px-5 py-2 shadow-sm shadow-[#10201d]/5 backdrop-blur-xl sm:px-8 lg:px-10">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="landing-hover-lift inline-flex items-center gap-3 text-black">
            <Image src="/assets/orderko-logo.png" alt="OrderKo" width={112} height={112} priority className="size-10 rounded-xl object-cover shadow-md shadow-[#10201d]/12 sm:size-11" />
            <span className="wonder-glow-style text-lg leading-none sm:text-xl">ORDERKO</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs font-bold text-black sm:gap-x-6 sm:text-sm">
            <Link href="#how">How it works</Link>
            <Link href="#demo">Product preview</Link>
            <Link href="#plans">Plans</Link>
            <Link href="#contact">Contact us</Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/orderko-landing-hero.jpg')" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,16,0.9),rgba(11,18,16,0.66),rgba(11,18,16,0.24))]" />
        <div className="relative mx-auto grid min-h-[82svh] max-w-7xl content-center px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="max-w-4xl text-white">
            <p className="landing-fade-in text-sm font-black uppercase tracking-[0.22em] text-[#b7e4d7]">QR ordering + kiosk workflow for restaurants</p>
            <h1 className="landing-fade-in landing-fade-delay-1 mt-5 text-5xl font-black leading-[0.98] sm:text-7xl lg:text-8xl">
              Reduce Queues Without Buying Kiosk Hardware
            </h1>
            <p className="landing-fade-in landing-fade-delay-2 mt-5 text-3xl font-normal sm:text-5xl">
              <span className="wonder-glow-style">Scan. Order. Pay. Bon Appetit.</span>
            </p>
            <p className="landing-fade-in landing-fade-delay-2 mt-6 max-w-2xl text-lg font-medium leading-8 text-white/88 sm:text-xl">
              OrderKo helps cafes, takeaway shops, milk tea stores, and food stalls take orders faster through QR and kiosk ordering.
            </p>
            <div className="landing-fade-in landing-fade-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#contact" className="rounded-full bg-[#0f766e] px-7 py-4 text-center text-base font-black text-white shadow-xl shadow-black/20 hover:bg-[#0d5f59]">Request a Pilot Demo</Link>
              <Link href="#demo" className="rounded-full bg-white/94 px-7 py-4 text-center text-base font-black text-[#17211f] hover:bg-white">View Product Preview</Link>
            </div>
            <p className="mt-4 text-sm font-bold text-white/78">Built for pay-at-counter restaurants, small teams, and rush-hour service.</p>
            <div className="mt-8 flex flex-wrap gap-2 text-sm font-bold text-white/84">
              {["No app download", "Pay at counter", "Phones, tablets, kiosks", "Built for busy shifts"].map((item) => (
                <span key={item} className="rounded-full border border-white/24 bg-white/10 px-3 py-2 backdrop-blur">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>The problem</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Rush hour exposes every weak spot in ordering.</h2>
            <p className="mt-5 max-w-xl leading-8 text-[#5f6c68]">When the line gets long, staff repeat orders, customers change details, and the kitchen has to work from rushed notes.</p>
            <p className="mt-4 max-w-xl font-bold leading-7 text-[#0f766e]">OrderKo gives customers a clearer way to order before they reach the counter.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {painPoints.map((item) => <Card key={item} className="font-bold">{item}</Card>)}
          </div>
        </div>
      </section>

      <section className="landing-section bg-white/72 px-5 py-16 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionLabel>Why use OrderKo?</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Simple restaurant ordering. Serious operational impact.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {values.map(([title, text]) => (
              <Card key={title}>
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-2 leading-7 text-[#5f6c68]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section bg-[#17302b] px-5 py-16 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b7e4d7]">Built for busy lunch rushes</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Customers order before they reach the counter.</h2>
            <p className="mt-5 leading-8 text-white/76">Before: cashier asks, repeats, edits, confirms, and passes rushed notes. After: customer orders first, cashier confirms payment, and the kitchen gets the details.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["No bulky kiosk machines", "No complicated enterprise setup", "No messy chat or handwritten order flow", "A simple system staff can learn quickly"].map((item) => (
              <div key={item} className="rounded-[1.35rem] border border-white/14 bg-white/8 p-5 font-black backdrop-blur">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="landing-section scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Clear in under 10 seconds.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {steps.map(([title, text], index) => (
                <Card key={title} className="md:p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-[#0f766e] text-sm font-black text-white">{index + 1}</span>
                  <h3 className="mt-4 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5f6c68]">{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section bg-white/72 px-5 py-16 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>Perfect for</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Built for businesses like yours.</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {perfectFor.map((item) => <Card key={item} className="text-center font-black">{item}</Card>)}
            </div>
          </div>
          <div>
            <SectionLabel>What is included</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">The core workflow, not feature bloat.</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f7f4ee] p-4 font-bold">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#0f766e] text-xs text-white">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="landing-section scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionLabel>Product preview</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Explore the product like a restaurant owner.</h2>
            <p className="mt-4 leading-8 text-[#5f6c68]">Explore a guided preview using a restaurant example. See the same flow your customers and staff would use during real service.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {demos.map(([title, text, href]) => (
              <Link key={title} href={href} className="landing-hover-lift rounded-[1.5rem] border border-white/70 bg-white/70 p-6 shadow-xl shadow-[#10201d]/7 backdrop-blur-xl">
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-[#5f6c68]">{text}</p>
                <span className="mt-5 inline-flex font-black text-[#0f766e]">Open preview</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="landing-section scroll-mt-24 bg-white/72 px-5 py-16 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <SectionLabel>Plans</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Affordable plans for food businesses.</h2>
            <p className="mt-4 leading-8 text-[#5f6c68]">Start with QR ordering, add kiosk workflows when you need them, and keep setup lightweight.</p>
          </div>
          <LandingPricingPlans />
          <div className="mt-6 flex flex-col gap-3 rounded-[1.35rem] border border-[#dfe8e2] bg-white/62 p-5 shadow-xl shadow-[#10201d]/7 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bold leading-7 text-[#5f6c68]">No expensive kiosk machines. No long setup. Cancel or adjust after your pilot.</p>
            <Link href="#contact" className="rounded-full bg-[#0f766e] px-6 py-3 text-center text-sm font-black text-white hover:bg-[#0d5f59]">Request pilot pricing</Link>
          </div>
        </div>
      </section>

      <section className="landing-section bg-[#f0ebe2] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          <Card>
            <h3 className="text-2xl font-black">Why now?</h3>
            <p className="mt-3 leading-7 text-[#5f6c68]">Customers expect faster service. Small teams need better tools. QR scanning is already familiar, and manual ordering creates avoidable mistakes.</p>
          </Card>
          <Card>
            <h3 className="text-2xl font-black">Our mission</h3>
            <p className="mt-3 leading-7 text-[#5f6c68]">We built OrderKo to help small food businesses modernize without expensive hardware or complicated systems.</p>
          </Card>
          <Card>
            <h3 className="text-2xl font-black">Focused today</h3>
            <p className="mt-3 leading-7 text-[#5f6c68]">OrderKo focuses on QR ordering, kiosk ordering, cashier flow, kitchen workflow, and menu control before adding advanced features.</p>
          </Card>
        </div>
      </section>

      <section className="landing-section bg-white/72 px-5 py-16 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionLabel>What happens after you request a demo?</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">We help you test it with your real workflow.</h2>
            <p className="mt-4 leading-8 text-[#5f6c68]">No commitment. We will show how OrderKo can fit your menu, counter flow, and staff process before you decide.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {setupSteps.map((item, index) => (
              <Card key={item}>
                <span className="text-sm font-black text-[#0f766e]">Step {index + 1}</span>
                <h3 className="mt-2 text-lg font-black">{item}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Practical answers for restaurant owners.</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <Card key={question}>
                <h3 className="text-lg font-black">{question}</h3>
                <p className="mt-2 leading-7 text-[#5f6c68]">{answer}</p>
              </Card>
            ))}
          </div>
          <p className="mt-6 rounded-[1.25rem] bg-[#17302b] p-5 font-bold leading-7 text-white">
            OrderKo is not built for complex enterprise chains yet. It is built for small food businesses that need faster ordering without expensive hardware.
          </p>
        </div>
      </section>

      <section id="contact" className="landing-section scroll-mt-24 bg-white/72 px-5 py-16 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[1.75rem] border border-white/70 bg-white/58 p-5 shadow-2xl shadow-[#10201d]/10 backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-7">
          <div>
            <SectionLabel>Request a demo</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Tell us about your restaurant.</h2>
            <p className="mt-4 leading-8 text-[#5f6c68]">We will reply personally and help you decide if OrderKo fits your workflow.</p>
            <p className="mt-4 rounded-2xl bg-[#edfbf7] p-4 text-sm font-bold leading-6 text-[#0f766e]">
              No commitment. Requesting a demo simply starts a conversation about your menu, queue, and service flow.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#5f6c68]">
              You can also email <a className="text-[#0f766e] underline-offset-4 hover:underline" href="mailto:hello.orderko@gmail.com">hello.orderko@gmail.com</a>.
            </p>
          </div>
          <LandingLeadForm />
        </div>
      </section>

      <footer className="border-t border-[#dfe8e2] bg-[#f7f4ee] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-semibold text-[#5f6c68] sm:flex-row sm:items-center sm:justify-between">
          <p>OrderKo.com - Built and operated for small food businesses testing faster ordering workflows.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/staff/login" className="hover:text-[#0f766e]">Staff login</Link>
            <Link href="/privacy" className="hover:text-[#0f766e]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#0f766e]">Terms</Link>
            <a href="mailto:hello.orderko@gmail.com" className="hover:text-[#0f766e]">hello.orderko@gmail.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
