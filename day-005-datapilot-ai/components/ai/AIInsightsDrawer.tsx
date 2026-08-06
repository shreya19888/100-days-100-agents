"use client";

import { useState } from "react";
import type { DatasetMetadata } from "@/lib/datasets/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
type Props = {
  dataset: DatasetMetadata;
};

export default function AIInsightsDrawer({ dataset }: Props) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [open, setOpen] = useState(false);

  async function explain() {
    setLoading(true);

    try {
      const res = await fetch("/api/datahub/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset: dataset.title,
        }),
      });

      const data = await res.json();

      setAnswer(data.answer);
    } finally {
      setLoading(false);
    }
  }

  async function openDrawer() {
    setOpen(true);

    if (!answer) {
      await explain();
    }
  }

  return (
    <>
      <button
        onClick={openDrawer}
        className="w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700"
      >
        ✨ Explain with AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-[900px] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 border-b bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">🤖 Enterprise Data Assistant</h2>
                  <p className="text-gray-500 mt-2">
                    AI-generated documentation, lineage insights and engineering guidance
                  </p>

                  <p className="text-gray-500">{dataset.title}</p>
                </div>

                <button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2">
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-6 p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Metric title="👤 Owner" value={dataset.owner} />

                <Metric title="🏢 Domain" value={dataset.domain} />

                <Metric title="📈 Data Quality" value={`${dataset.quality}%`} />

                <Metric title="🔄 Refresh" value={dataset.refresh} />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl bg-green-50 border border-green-200 p-5">
                  <p className="text-sm text-gray-500">Platform</p>

                  <p className="mt-2 text-xl font-bold">{dataset.platform}</p>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
                  <p className="text-sm text-gray-500">Mission</p>

                  <p className="mt-2 text-lg font-semibold">{dataset.mission}</p>
                </div>

                <div className="rounded-xl bg-purple-50 border border-purple-200 p-5">
                  <p className="text-sm text-gray-500">Learning Modules</p>

                  <p className="mt-2 text-2xl font-bold">{dataset.learning.length}</p>
                </div>
              </div>

              {loading && (
                <div className="rounded-2xl border bg-white p-8">
                  <div className="mb-6 h-6 w-56 animate-pulse rounded bg-slate-200" />
                  <div className="mb-3 h-4 animate-pulse rounded bg-slate-200" />
                  <div className="mb-3 h-4 animate-pulse rounded bg-slate-200" />
                  <div className="mb-3 h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                  <div className="mt-8 h-40 animate-pulse rounded-xl bg-slate-100" />
                </div>
              )}
              {!loading && answer && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <MarkdownRenderer content={answer} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="text-sm text-gray-500">{title}</p>

      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
