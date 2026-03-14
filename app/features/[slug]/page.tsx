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
    <main className="min-h-screen py-8">
      <div className="ui-container">
        <section className="ui-card p-6 md:p-10">
          <p className="ui-chip">{feature.category}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{feature.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-700">{feature.summary}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="ui-card-soft p-5">
              <h2 className="text-xl font-black">Why It Matters</h2>
              <p className="mt-3 text-slate-700">{feature.whyItMatters}</p>
            </article>
            <article className="ui-card-soft p-5">
              <h2 className="text-xl font-black">Requirement Checklist</h2>
              <ul className="mt-3 space-y-2 text-slate-700">
                {feature.requirements.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/showcase/${feature.slug}`} className="ui-btn-primary px-5 py-3 text-sm">
              View Module
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
