const datasets = [
  {
    name: "Employee Master",
    owner: "People Analytics",
  },
  {
    name: "Compensation",
    owner: "Rewards Team",
  },
  {
    name: "Promotion History",
    owner: "Talent Intelligence",
  },
];

export default function RecommendationCard() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">
        Recommended Datasets
      </h2>

      <div className="grid gap-5 md:grid-cols-3">

        {datasets.map((dataset) => (
          <div
            key={dataset.name}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 hover:border-blue-500"
          >
            <h3 className="text-xl font-bold">
              {dataset.name}
            </h3>

            <p className="mt-3 text-zinc-400">
              Owner
            </p>

            <p className="font-medium">
              {dataset.owner}
            </p>

            <button className="mt-6 rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-500">
              Explore
            </button>
          </div>
        ))}

      </div>
    </section>
  );
}