type Props = {
  upstream: string[];
  downstream: string[];
};

export default function DatasetRelationships({
  upstream,
  downstream,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        🔗 Dataset Relationships
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        <div>

          <h3 className="mb-4 text-lg font-semibold text-blue-600">
            Upstream Sources
          </h3>

          <div className="space-y-3">

            {upstream.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-blue-200 bg-blue-50 p-3"
              >
                <div className="font-medium">
                  {item}
                </div>

                <div className="text-sm text-gray-500">
                  Source System
                </div>
              </div>
            ))}

          </div>

        </div>

        <div>

          <h3 className="mb-4 text-lg font-semibold text-green-600">
            Downstream Consumers
          </h3>

          <div className="space-y-3">

            {downstream.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-green-200 bg-green-50 p-3"
              >
                <div className="font-medium">
                  {item}
                </div>

                <div className="text-sm text-gray-500">
                  Consumer
                </div>
              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}