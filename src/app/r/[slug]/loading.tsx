export default function MenuLoading() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-[#182522]">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[1.35rem] bg-[#13201d] p-5 shadow-[0_22px_70px_rgba(19,32,29,0.18)]">
          <div className="h-4 w-28 animate-pulse rounded bg-teal-100/30" />
          <div className="mt-4 h-9 w-48 animate-pulse rounded bg-white/20" />
          <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-4 w-56 max-w-full animate-pulse rounded bg-white/15" />
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
        <div className="mt-5 flex gap-2 overflow-hidden">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-11 w-28 shrink-0 animate-pulse rounded-full bg-white shadow-sm" />
          ))}
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="min-h-36 rounded-2xl border border-[#e2ded4] bg-white p-3 shadow-[0_10px_30px_rgba(28,39,35,0.06)]">
              <div className="flex gap-3">
                <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-[#edf0e8]" />
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="mt-5 h-5 w-20 animate-pulse rounded bg-teal-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
