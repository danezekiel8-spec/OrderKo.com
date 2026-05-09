export default function OrderLoading() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-[#182522]">
      <section className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-[1.35rem] border border-[#e0ddd4] bg-white p-5 shadow-[0_22px_70px_rgba(28,39,35,0.12)]">
          <div className="h-4 w-28 animate-pulse rounded bg-teal-100" />
          <div className="mt-4 h-14 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-4 w-64 max-w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-6 rounded-2xl bg-[#eef8f5] p-4">
            <div className="h-4 w-28 animate-pulse rounded bg-teal-100" />
            <div className="mt-3 h-8 w-48 animate-pulse rounded bg-teal-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/80" />
          </div>
        </div>
        <div className="rounded-[1.35rem] border border-[#e0ddd4] bg-white p-5 shadow-[0_14px_42px_rgba(28,39,35,0.08)]">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex gap-3 pb-4">
              <div className="size-8 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
