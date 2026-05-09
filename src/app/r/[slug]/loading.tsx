export default function MenuLoading() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-[#16211f]">
      <section className="mx-auto max-w-6xl">
        <div className="h-4 w-24 animate-pulse rounded bg-teal-100" />
        <div className="mt-3 h-8 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-6 flex gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-11 w-24 animate-pulse rounded-full bg-white" />
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="min-h-32 rounded-lg border border-[#dbe4df] bg-white p-4 shadow-sm">
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 h-5 w-20 animate-pulse rounded bg-teal-100" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
