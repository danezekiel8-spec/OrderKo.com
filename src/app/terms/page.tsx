import type { Metadata } from "next";
import Link from "next/link";
import { OrderKoBrand } from "@/components/orderko-brand";

export const metadata: Metadata = {
  title: "Terms of Service | OrderKo.com",
  description: "Basic terms for using OrderKo restaurant ordering and operations software.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#16211f] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="inline-flex">
          <OrderKoBrand />
        </Link>
        <h1 className="mt-6 text-4xl font-black">Terms of Service</h1>
        <p className="mt-4 leading-8 text-[#5f6c68]">
          These starter terms describe the basic responsibilities for using OrderKo during pilot and
          early production usage.
        </p>

        <div className="mt-8 space-y-6 leading-8 text-[#33423f]">
          <section>
            <h2 className="text-xl font-black text-[#16211f]">Restaurant responsibility</h2>
            <p className="mt-2">
              Restaurants are responsible for keeping menu prices accurate, marking items sold out,
              confirming payments, and handling customer service at the counter.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#16211f]">Service availability</h2>
            <p className="mt-2">
              OrderKo is designed for reliable everyday operation, but restaurants should keep a
              manual fallback process available for internet outages, device issues, or unexpected downtime.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#16211f]">Access and security</h2>
            <p className="mt-2">
              Staff PINs and admin access should be shared only with authorized restaurant personnel.
              Restaurants should request credential changes if access is no longer appropriate.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#16211f]">Contact</h2>
            <p className="mt-2">
              For support or terms questions, contact{" "}
              <a className="font-bold text-[#0f766e]" href="mailto:support@orderko.com">
                support@orderko.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
