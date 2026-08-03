import { Target } from "lucide-react";

export default function MissionCard() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center gap-3">
        <Target className="text-orange-400" />

        <h2 className="text-2xl font-bold">
          Today's Mission
        </h2>
      </div>

      <div className="mt-6">

        <p className="text-3xl font-bold">
          Understand Employee Attrition
        </p>

        <p className="mt-3 text-zinc-400">
          Learn how employee attrition is calculated using
          multiple datasets and lineage.
        </p>

        <button className="mt-8 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500">
          Start Mission
        </button>

      </div>
    </section>
  );
}