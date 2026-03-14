import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeatureBySlug, productFeatures } from "@/lib/product-features";

export function generateStaticParams() {
  return productFeatures.map((feature) => ({ slug: feature.slug }));
}

export default function FeatureShowcasePage({
  params,
}: {
  params: { slug: string };
}) {
  const feature = getFeatureBySlug(params.slug);

  if (!feature) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-8">
      <div className="ui-container">
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/65 p-6 shadow-2xl backdrop-blur md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Module Preview</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white">{feature.title}</h1>
              <p className="mt-2 text-slate-300">Sample product data showing how this module works in production.</p>
            </div>
            <Link href={`/features/${feature.slug}`} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
              Learn More
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {feature.staticPreview.kpis.map((kpi) => (
              <article key={kpi.label} className="rounded-xl border border-slate-700/60 bg-slate-800/70 p-4">
                <p className="text-sm font-semibold text-slate-300">{kpi.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{kpi.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-700/60">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/80 text-left text-slate-200">
                <tr>
                  {feature.staticPreview.columns.map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feature.staticPreview.rows.map((row) => (
                  <tr key={row.join("|")} className="border-t border-slate-700/60">
                    {row.map((cell) => (
                      <td key={cell} className="px-4 py-3 text-slate-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Open Product Dashboard
            </Link>
            <Link href="/" className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">
              Back to Landing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
