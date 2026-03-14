function LoadingCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 space-y-3">
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div>
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <LoadingCard />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </section>
  );
}
