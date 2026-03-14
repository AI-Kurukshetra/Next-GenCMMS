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
    <main className="min-h-screen py-8">
      <div className="ui-container">
        <section className="ui-card p-6 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="ui-chip">Module Preview</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight">{feature.title}</h1>
              <p className="mt-2 text-slate-700">Sample product data showing how this module works in production.</p>
            </div>
            <Link href={`/features/${feature.slug}`} className="ui-btn-ghost px-4 py-2 text-sm">
              Learn More
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {feature.staticPreview.kpis.map((kpi) => (
              <article key={kpi.label} className="ui-card-soft p-4">
                <p className="text-sm font-semibold text-slate-600">{kpi.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{kpi.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
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
                  <tr key={row.join("|")} className="border-t border-slate-100">
                    {row.map((cell) => (
                      <td key={cell} className="px-4 py-3 text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="ui-btn-primary px-5 py-3 text-sm">
              Open Product Dashboard
            </Link>
            <Link href="/" className="ui-btn-ghost px-5 py-3 text-sm">
              Back to Landing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
