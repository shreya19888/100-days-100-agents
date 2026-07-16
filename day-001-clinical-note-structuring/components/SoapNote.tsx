type SoapNoteProps = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export default function SoapNote({
  subjective,
  objective,
  assessment,
  plan,
}: SoapNoteProps) {
  return (
    <section className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-lg">
      <h2 className="mb-8 text-2xl font-bold text-white">
        Structured SOAP Note
      </h2>

      <div className="space-y-8">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-blue-400">
            Subjective
          </h3>
          <p className="text-zinc-300">{subjective}</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-green-400">
            Objective
          </h3>
          <p className="text-zinc-300">{objective}</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-yellow-400">
            Assessment
          </h3>
          <p className="text-zinc-300">{assessment}</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-purple-400">
            Plan
          </h3>
          <p className="text-zinc-300">{plan}</p>
        </div>
      </div>
    </section>
  );
}