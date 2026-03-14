import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeatureBySlug, productFeatures } from "@/lib/product-features";

export function generateStaticParams() {
  return productFeatures.map((feature) => ({ slug: feature.slug }));
}

export default function FeatureDetailsPage({
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
          <p className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
            {feature.category}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">{feature.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">{feature.summary}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="rounded-xl border border-slate-700/60 bg-slate-800/70 p-5">
              <h2 className="text-xl font-black text-white">Why It Matters</h2>
              <p className="mt-3 text-slate-300">{feature.whyItMatters}</p>
            </article>
            <article className="rounded-xl border border-slate-700/60 bg-slate-800/70 p-5">
              <h2 className="text-xl font-black text-white">Requirement Checklist</h2>
              <ul className="mt-3 space-y-2 text-slate-300">
                {feature.requirements.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/showcase/${feature.slug}`} className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              View Module
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
