import { Assessment } from "../types/climate";

type AIRecommendationProps = {
  assessment: Assessment | null;
};

export default function AIRecommendation({
  assessment,
}: AIRecommendationProps) {
  if (!assessment) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">
          Climate Pulse Assessment
        </h2>

        <p className="mt-3 text-slate-500">
          Analyze today's weather to receive an AI-generated
          outdoor safety assessment.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800">
        Climate Pulse Assessment
      </h2>

      <p className="mt-4 text-slate-700">
        {assessment.summary}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-green-50 p-5">
          <h3 className="font-semibold text-green-700">
            Best Work Window
          </h3>

          <p className="mt-2">
            {assessment.bestWorkWindow}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-5">
          <h3 className="font-semibold text-red-700">
            Avoid Work Window
          </h3>

          <p className="mt-2">
            {assessment.avoidWorkWindow}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg font-semibold">
            Recommendations
          </h3>

          <ul className="list-disc space-y-2 pl-5">
            {assessment.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">
            Hydration Plan
          </h3>

          <ul className="list-disc space-y-2 pl-5">
            {assessment.hydration.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">
            Recommended PPE
          </h3>

          <ul className="list-disc space-y-2 pl-5">
            {assessment.ppe.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-red-700">
            Warning Signs
          </h3>

          <ul className="list-disc space-y-2 pl-5">
            {assessment.warningSigns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}