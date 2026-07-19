type SoapSection = string | Record<string, unknown> | unknown[];

type Soap = {
  subjective: SoapSection;
  objective: SoapSection;
  assessment: SoapSection;
  plan: SoapSection;
};

type Props = {
  soap: Soap | null;
};

function renderValue(value: unknown): React.ReactNode {
  if (value == null) {
    return <span className="text-zinc-500">N/A</span>;
  }

  if (typeof value === "string") {
    return (
      <p className="whitespace-pre-wrap leading-7 text-zinc-300">
        {value}
      </p>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc pl-5 text-zinc-300">
        {value.map((item, index) => (
          <li key={index}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-3">
        {Object.entries(value).map(([key, val]) => (
          <div key={key}>
            <h4 className="text-sm font-semibold capitalize text-zinc-400">
              {key.replace(/([A-Z])/g, " $1")}
            </h4>

            {renderValue(val)}
          </div>
        ))}
      </div>
    );
  }

  return <p>{String(value)}</p>;
}

export default function SoapViewer({ soap }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-6 text-2xl font-semibold">
        🩺 SOAP Note
      </h2>

      {!soap ? (
        <p className="text-zinc-500">
          Record a patient encounter to generate a SOAP note.
        </p>
      ) : (
        <div className="space-y-8">
          <section>
            <h3 className="mb-2 font-semibold text-blue-400">
              Subjective
            </h3>
            {renderValue(soap.subjective)}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-blue-400">
              Objective
            </h3>
            {renderValue(soap.objective)}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-blue-400">
              Assessment
            </h3>
            {renderValue(soap.assessment)}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-blue-400">
              Plan
            </h3>
            {renderValue(soap.plan)}
          </section>
        </div>
      )}
    </div>
  );
}