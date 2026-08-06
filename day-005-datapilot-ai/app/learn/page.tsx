import Link from "next/link";
import { datasets } from "@/lib/datasets";

export default function LearningHubPage() {
  const datasetList = Object.values(datasets);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-10 py-16">
          <h1 className="text-5xl font-black">📚 Learning Hub</h1>

          <p className="mt-4 text-xl text-blue-100">
            Learn your enterprise data ecosystem with guided courses, documentation, SQL labs and AI
            recommendations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl p-10">
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard title="Datasets" value={datasetList.length.toString()} />

          <StatCard
            title="Courses"
            value={datasetList.reduce((sum, d) => sum + d.learning.length, 0).toString()}
          />

          <StatCard title="SQL Labs" value="25+" />

          <StatCard title="Learning Paths" value="5" />
        </div>

        <h2 className="mt-12 mb-6 text-3xl font-bold">Recommended Learning Paths</h2>

        <div className="grid gap-8 md:grid-cols-2">
          {datasetList.map((dataset) => (
            <div
              key={dataset.id}
              className="rounded-3xl border bg-white p-8 shadow-sm hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{dataset.title}</h3>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  {dataset.domain}
                </span>
              </div>

              <p className="mt-4 text-gray-600">{dataset.description}</p>

              <div className="mt-6 space-y-3">
                {dataset.learning.map((course) => (
                  <div
                    key={course.title}
                    className="rounded-xl border bg-slate-50 p-5 transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold">{course.title}</p>

                        <div className="mt-2 flex gap-2">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {course.level}
                          </span>

                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            {course.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          `${course.title} ${dataset.title}`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                      >
                        ▶ Start Learning
                      </a>

                      <a
                        href="https://docs.snowflake.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border px-4 py-2 font-semibold hover:bg-slate-100"
                      >
                        Documentation
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                <Link
                  href={`/datasets/${encodeURIComponent(dataset.id)}`}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  📊 Open Dataset
                </Link>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `${dataset.title} data engineering`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border px-6 py-3 font-semibold transition hover:bg-slate-100"
                >
                  🎥 Watch Videos
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <p className="mt-3 text-4xl font-bold">{value}</p>
    </div>
  );
}
