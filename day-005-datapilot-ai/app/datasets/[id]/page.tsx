import Link from "next/link";
import AIInsightsDrawer from "@/components/ai/AIInsightsDrawer";
import { datasets } from "@/lib/datasets";
import LineageDrawer from "@/components/lineage/LineageDrawer";
import LearningResourcesDrawer from "@/components/LearningResourcesDrawer";
import DatasetHealthChart from "@/components/charts/DatasetHealthChart";
import LineageActivityChart from "@/components/charts/LineageActivityChart";
import DatasetRelationships from "@/components/DatasetRelationships";
type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DatasetPage({ params }: Props) {
  const { id } = await params;

  const datasetName = decodeURIComponent(id).toLowerCase();

  const dataset = datasets[datasetName] ?? datasets["employee master"];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-10 py-10">
          <Link href="/datasets" className="text-blue-600 hover:underline">
            ← Back to Catalog
          </Link>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black">{dataset.title}</h1>

              <div className="mt-5 flex gap-3 flex-wrap">
                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                  {dataset.platform}
                </span>

                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  Production
                </span>

                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                  Gold Dataset
                </span>
              </div>
            </div>

            <div className="text-7xl">📊</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl p-10">
        <div className="grid gap-5 md:grid-cols-4 mb-8">
          <Stat title="Owner" value={dataset.owner} />

          <Stat title="Domain" value={dataset.domain} />

          <Stat title="Quality" value={`${dataset.quality}%`} green />

          <Stat title="Refresh" value={dataset.refresh} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card title="Business Description">
              <p>{dataset.description}</p>
            </Card>

            <Card title="Schema">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Column</th>

                    <th className="py-2 text-left">Type</th>
                  </tr>
                </thead>

                <tbody>
                  {dataset.schema.map((c) => (
                    <tr key={c.name} className="border-b">
                      <td className="py-2 font-mono">{c.name}</td>

                      <td className="py-2">{c.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Sample Data">
              <div className="overflow-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {Object.keys(dataset.sampleData[0]).map((col) => (
                        <th key={col} className="border-b px-4 py-2 text-left">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {dataset.sampleData.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="border-b px-4 py-2">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <DatasetHealthChart quality={dataset.quality} />

              <LineageActivityChart
                upstream={dataset.lineage.upstream.length}
                downstream={dataset.lineage.downstream.length}
              />
            </div>
          </div>

          <div className="space-y-5">
            <AIInsightsDrawer dataset={dataset} />

            <LineageDrawer
              dataset={dataset.title}
              upstream={dataset.lineage.upstream}
              downstream={dataset.lineage.downstream}
            />

            <LearningResourcesDrawer dataset={dataset} />
            <DatasetRelationships
            upstream={dataset.lineage.upstream}
            downstream={dataset.lineage.downstream}
            />

            <Card title="Common Joins">
              {dataset.joins.map((join) => (
                <div key={join.dataset} className="mb-3 rounded-lg bg-slate-100 p-3">
                  <p className="font-semibold">{join.dataset}</p>

                  <p className="text-sm text-gray-500">Join Key: {join.key}</p>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-2xl font-bold">{title}</h2>

      {children}
    </div>
  );
}

function Stat({ title, value, green }: { title: string; value: string; green?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-gray-500">{title}</p>

      <p className={`mt-2 text-2xl font-bold ${green ? "text-green-600" : ""}`}>{value}</p>
    </div>
  );
}
