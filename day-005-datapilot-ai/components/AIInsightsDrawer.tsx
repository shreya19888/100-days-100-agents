"use client";
import AIInsightCards from "./AIInsightCards";
import { useState } from "react";

type Props = {
  dataset: string;
};

export default function AIInsightsDrawer({
  dataset,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  async function explain() {
    setOpen(true);

    if (answer) return;

    setLoading(true);

    try {
      const res = await fetch("/api/datahub/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset,
        }),
      });

      const data = await res.json();

      setAnswer(data.answer);
    } catch (e) {
      console.error(e);
      setAnswer("Unable to generate explanation.");
    }

    setLoading(false);
  }

  return (
    <>
      <button
        onClick={explain}
        className="w-full rounded-2xl bg-blue-600 p-5 text-lg font-semibold text-white hover:bg-blue-700"
      >
        ✨ Explain with AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[700px] overflow-y-auto bg-white shadow-2xl">

            <div className="sticky top-0 border-b bg-white p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-3xl font-bold">
                    AI Insights
                  </h2>

                  <p className="text-gray-500">
                    {dataset}
                  </p>

                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border px-4 py-2"
                >
                  ✕
                </button>

              </div>

            </div>

            <div className="space-y-8 p-8">

              {loading && (

                <div className="space-y-4">

                  <div className="h-8 animate-pulse rounded bg-gray-200" />

                  <div className="h-6 animate-pulse rounded bg-gray-100" />

                  <div className="h-6 animate-pulse rounded bg-gray-100" />

                  <div className="h-40 animate-pulse rounded bg-gray-100" />

                </div>

              )}

              {!loading && (

                <AIInsightCards answer={answer} />

              )}

            </div>

          </div>

        </div>
      )}
    </>
  );
}