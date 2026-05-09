export default function OrderLoading() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] text-[#16211f]">
      <section className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-[#dbe4df] bg-white p-5 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded bg-teal-100" />
          <div className="mt-4 h-12 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-56 max-w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-6 rounded-lg bg-[#eef8f5] p-4">
            <div className="h-4 w-28 animate-pulse rounded bg-teal-100" />
            <div className="mt-3 h-8 w-48 animate-pulse rounded bg-teal-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/80" />
          </div>
        </div>
      </section>
    </main>
  );
}
