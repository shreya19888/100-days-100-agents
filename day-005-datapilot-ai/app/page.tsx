import Link from "next/link";
import { datasets } from "@/lib/datasets";

const features = [
  {
    title: "Enterprise Catalog",
    description: "Search and explore enterprise datasets powered by AI.",
    href: "/datasets",
    icon: "📚",
    color: "from-blue-500 to-blue-700",
  },
  {
    title: "AI Copilot",
    description: "Ask questions in natural language and generate SQL instantly.",
    href: "/copilot",
    icon: "🤖",
    color: "from-purple-500 to-indigo-700",
  },
  {
    title: "Learning Missions",
    description: "Gamified onboarding for enterprise data engineers.",
    href: "/missions",
    icon: "🎯",
    color: "from-green-500 to-emerald-700",
  },
  {
    title: "Learning Hub",
    description: "Courses, documentation, quizzes and labs.",
    href: "/learn",
    icon: "📖",
    color: "from-orange-500 to-red-600",
  },
];

export default function HomePage() {
  const datasetList = Object.values(datasets);

  return (
    <main className="min-h-screen bg-slate-50">

      <section className="bg-gradient-to-r from-slate-950 via-blue-900 to-indigo-900 text-white">

        <div className="mx-auto max-w-7xl px-10 py-20">

          <div className="max-w-4xl">

            <div className="inline-flex rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold">
              🚀 AI-Powered Enterprise Data Engineering
            </div>

            <h1 className="mt-6 text-6xl font-black leading-tight">
              DataPilot AI
            </h1>

            <p className="mt-6 text-2xl text-blue-100">
              Accelerate enterprise data onboarding with AI-powered dataset
              discovery, lineage, documentation, SQL generation and guided
              learning.
            </p>

            <div className="mt-10 flex gap-5">

              <Link
                href="/datasets"
                className="rounded-xl bg-white px-8 py-4 font-bold text-slate-900 hover:bg-slate-100"
              >
                Explore Catalog
              </Link>

              <Link
                href="/copilot"
                className="rounded-xl border border-white/30 px-8 py-4 font-bold hover:bg-white/10"
              >
                Open AI Copilot
              </Link>

            </div>

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-10 py-12">

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Enterprise Datasets"
            value={datasetList.length.toString()}
          />

          <StatCard
            title="Business Domains"
            value="6"
          />

          <StatCard
            title="Learning Modules"
            value={datasetList
              .reduce((sum, d) => sum + d.learning.length, 0)
              .toString()}
          />

          <StatCard
            title="AI Readiness"
            value="92%"
          />

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-10 pb-8">

        <h2 className="mb-8 text-3xl font-black">
          Platform
        </h2>

        <div className="grid gap-8 md:grid-cols-2">

          {features.map((feature) => (

            <Link
              key={feature.title}
              href={feature.href}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >

              <div
                className={`bg-gradient-to-r ${feature.color} p-8 text-white`}
              >

                <div className="text-6xl">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-3xl font-black">
                  {feature.title}
                </h3>

              </div>

              <div className="p-8">

                <p className="text-lg leading-8 text-gray-600">
                  {feature.description}
                </p>

                <div className="mt-8 font-bold text-blue-600 group-hover:translate-x-2 transition">
                  Launch →
                </div>

              </div>

            </Link>

          ))}

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-10 pb-20">

        <h2 className="mb-8 text-3xl font-black">
          Recently Explored Datasets
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {datasetList.slice(0, 6).map((dataset) => (

            <Link
              key={dataset.id}
              href={`/datasets/${encodeURIComponent(dataset.id)}`}
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-lg"
            >

              <div className="flex items-center justify-between">

                <h3 className="text-xl font-bold">
                  {dataset.title}
                </h3>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                  {dataset.platform}
                </span>

              </div>

              <p className="mt-4 line-clamp-3 text-gray-600">
                {dataset.description}
              </p>

              <div className="mt-6 flex justify-between text-sm">

                <span>
                  👤 {dataset.owner}
                </span>

                <span className="font-semibold text-green-600">
                  {dataset.quality}%
                </span>

              </div>

            </Link>

          ))}

        </div>

      </section>

    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <p className="text-sm uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-5xl font-black">
        {value}
      </p>

    </div>
  );
}