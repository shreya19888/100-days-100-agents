"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { datasets } from "@/lib/datasets";
import {
  Database,
  Search,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function DatasetsPage() {
  const [search, setSearch] = useState("");

  const datasetList = Object.values(datasets);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return datasetList.filter((dataset) => {
      return (
        dataset.title.toLowerCase().includes(q) ||
        dataset.domain.toLowerCase().includes(q) ||
        dataset.owner.toLowerCase().includes(q) ||
        dataset.description.toLowerCase().includes(q)
      );
    });
  }, [search, datasetList]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="mx-auto max-w-7xl px-10 py-16">
          <div className="flex items-center gap-4">
            <Database size={42} />

            <div>
              <h1 className="text-5xl font-black">
                Enterprise Data Catalog
              </h1>

              <p className="mt-3 text-xl text-blue-100">
                Discover, understand and explore enterprise datasets with AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl p-10">
        <div className="mb-10 grid gap-6 md:grid-cols-4">
          <Stat
            title="Datasets"
            value={datasetList.length.toString()}
          />

          <Stat title="Domains" value="6" />

          <Stat title="Platform" value="Snowflake" />

          <Stat title="Avg Quality" value="98%" />
        </div>

        <div className="relative mb-10">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            size={22}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets, owners or domains..."
            className="w-full rounded-2xl border bg-white py-5 pl-14 pr-5 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((dataset) => (
            <Link
              key={dataset.id}
              href={`/datasets/${encodeURIComponent(dataset.id)}`}
              className="group rounded-3xl border bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">
                  {dataset.title}
                </h2>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {dataset.platform}
                </span>
              </div>

              <p className="mt-5 line-clamp-3 text-gray-600">
                {dataset.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
                  <User size={14} />
                  {dataset.owner}
                </span>

                <span className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  <Building2 size={14} />
                  {dataset.domain}
                </span>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Quality Score
                  </p>

                  <div className="mt-2 flex items-center gap-2 font-bold text-green-600">
                    <ShieldCheck size={20} />

                    <span className="text-2xl">
                      {dataset.quality}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-blue-600 transition group-hover:translate-x-1">
                  Open

                  <ArrowRight size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-3xl border bg-white p-16 text-center shadow-sm">
            <Search
              className="mx-auto text-gray-400"
              size={64}
            />

            <h2 className="mt-6 text-3xl font-bold">
              No datasets found
            </h2>

            <p className="mt-4 text-gray-500">
              Try searching by owner, domain or dataset name.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({
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

      <p className="mt-3 text-4xl font-black">
        {value}
      </p>
    </div>
  );
}