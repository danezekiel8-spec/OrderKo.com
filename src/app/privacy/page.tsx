import type { Metadata } from "next";
import Link from "next/link";
import { OrderKoBrand } from "@/components/orderko-brand";

export const metadata: Metadata = {
  title: "Privacy Policy | OrderKo.com",
  description: "How OrderKo collects and uses restaurant, staff, order, and demo request data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#16211f] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="inline-flex">
          <OrderKoBrand />
        </Link>
        <h1 className="mt-6 text-4xl font-black">Privacy Policy</h1>
        <p className="mt-4 leading-8 text-[#5f6c68]">
          OrderKo collects only the information needed to run restaurant ordering, staff workflows,
          admin tools, and demo requests.
        </p>

        <div className="mt-8 space-y-6 leading-8 text-[#33423f]">
          <section>
            <h2 className="text-xl font-black text-[#16211f]">Information we collect</h2>
            <p className="mt-2">
              We may store restaurant details, menu data, order details, staff role sessions, uploaded
              menu image URLs, and contact details submitted through the demo form.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#16211f]">How we use it</h2>
            <p className="mt-2">
              We use this data to process orders, show order status, operate cashier and kitchen
              dashboards, manage restaurant accounts, respond to demo requests, and improve service reliability.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#16211f]">Data sharing</h2>
            <p className="mt-2">
              We do not sell customer or restaurant data. We may use infrastructure providers such as
              hosting, database, and image storage services to operate the product.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#16211f]">Contact</h2>
            <p className="mt-2">
              For privacy questions or data requests, contact{" "}
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
