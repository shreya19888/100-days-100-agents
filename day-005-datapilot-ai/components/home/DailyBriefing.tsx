export default function DailyBriefing() {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm uppercase tracking-widest text-blue-400">
        AI Daily Briefing
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        Here's what I recommend today.
      </h2>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
          <div>
            <p className="font-semibold">
              Learn Employee Master
            </p>

            <p className="text-sm text-zinc-400">
              Understand the core employee dataset.
            </p>
          </div>

          <span className="rounded-full bg-blue-600 px-3 py-1 text-sm">
            15 min
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-zinc-800 p-4">
          <div>
            <p className="font-semibold">
              Explore Data Lineage
            </p>

            <p className="text-sm text-zinc-400">
              See how employee data flows across systems.
            </p>
          </div>

          <span className="rounded-full bg-green-600 px-3 py-1 text-sm">
            New
          </span>
        </div>
      </div>
    </section>
  );
}