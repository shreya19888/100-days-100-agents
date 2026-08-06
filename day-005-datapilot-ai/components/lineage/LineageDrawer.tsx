"use client";

import { useState } from "react";
import {
  Database,
  ArrowDown,
  ArrowUp,
  GitBranch,
} from "lucide-react";

type Props = {
  dataset: string;
  upstream: string[];
  downstream: string[];
};

export default function LineageDrawer({
  dataset,
  upstream,
  downstream,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border bg-white py-4 font-semibold transition hover:bg-slate-100"
      >
        <div className="flex items-center justify-center gap-2">
          <GitBranch size={18} />
          View Lineage
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[700px] overflow-y-auto bg-white shadow-2xl">

            <div className="border-b bg-slate-900 p-6 text-white">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-3xl font-black">
                    Data Lineage
                  </h2>

                  <p className="mt-2 text-slate-300">
                    {dataset}
                  </p>

                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-white/10 px-4 py-2"
                >
                  ✕
                </button>

              </div>

            </div>

            <div className="space-y-8 p-8">

              <section>

                <div className="mb-5 flex items-center gap-2">

                  <ArrowUp className="text-blue-600" />

                  <h3 className="text-xl font-bold">
                    Upstream Sources
                  </h3>

                </div>

                <div className="space-y-4">

                  {upstream.map((item) => (

                    <div
                      key={item}
                      className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                    >

                      <div className="flex items-center gap-3">

                        <Database size={20} />

                        <div>

                          <p className="font-semibold">
                            {item}
                          </p>

                          <p className="text-sm text-gray-500">
                            Source System
                          </p>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </section>

              <div className="flex justify-center">

                <ArrowDown
                  size={40}
                  className="text-gray-400"
                />

              </div>

              <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center">

                <Database
                  className="mx-auto mb-4 text-blue-700"
                  size={40}
                />

                <h3 className="text-2xl font-bold">
                  {dataset}
                </h3>

                <p className="text-gray-500">
                  Current Dataset
                </p>

              </div>

              <div className="flex justify-center">

                <ArrowDown
                  size={40}
                  className="text-gray-400"
                />

              </div>

              <section>

                <div className="mb-5 flex items-center gap-2">

                  <ArrowDown className="text-green-600" />

                  <h3 className="text-xl font-bold">
                    Downstream Consumers
                  </h3>

                </div>

                <div className="space-y-4">

                  {downstream.map((item) => (

                    <div
                      key={item}
                      className="rounded-xl border border-green-200 bg-green-50 p-4"
                    >

                      <div className="flex items-center gap-3">

                        <Database size={20} />

                        <div>

                          <p className="font-semibold">
                            {item}
                          </p>

                          <p className="text-sm text-gray-500">
                            Consumer Application
                          </p>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </section>

            </div>

          </div>

        </div>
      )}
    </>
  );
}