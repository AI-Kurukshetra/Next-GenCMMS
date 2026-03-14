export default function RootLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-center shadow-2xl">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-indigo-400/30 border-t-indigo-400 animate-spin" />
        <h2 className="mt-4 text-xl font-semibold text-white">Loading</h2>
        <p className="mt-2 text-sm text-slate-300">Preparing the page and fetching latest data.</p>
      </div>
    </main>
  );
}
