"use client";

import { useState } from "react";

type SoapNote = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export default function ClinicalNoteForm() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);

  async function structureNote() {
    if (!note.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/structure-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      });

      const data = await response.json();
      setSoapNote(data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6">

      <div className="grid gap-8 lg:grid-cols-2">

        {/* LEFT COLUMN */}

        <div>
          <label
            htmlFor="clinical-note"
            className="mb-3 block text-lg font-semibold"
          >
            Clinical Note
          </label>

          <textarea
            id="clinical-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Example:

65-year-old male presents with fever for 3 days.
Blood pressure 165/100.
History of Type 2 Diabetes.
Complains of fatigue and dizziness.
No chest pain or shortness of breath.
Recommend CBC and follow-up in one week.`}
            className="h-96 w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-lg text-white shadow-xl placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition"
          />
        </div>

        {/* RIGHT COLUMN */}

        <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">

          <h2 className="mb-6 text-2xl font-bold">
            ✨ AI Generated SOAP Note
          </h2>

          {soapNote ? (
            <div className="space-y-8">

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
                  Subjective
                </h3>
                <p className="text-zinc-300">
                  {soapNote.subjective}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-400">
                  Objective
                </h3>
                <p className="text-zinc-300">
                  {soapNote.objective}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-yellow-400">
                  Assessment
                </h3>
                <p className="text-zinc-300">
                  {soapNote.assessment}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-400">
                  Plan
                </h3>
                <p className="text-zinc-300">
                  {soapNote.plan}
                </p>
              </div>

            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-center text-zinc-500">
              <div>
                <p className="text-xl font-semibold">
                  ✨ AI Generated SOAP Note
                </p>

                <p className="mt-3 max-w-sm">
                  Your structured clinical note will appear here after clicking
                  <span className="font-semibold text-cyan-400">
                    {" "}Structure Clinical Note
                  </span>.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      <button
        onClick={structureNote}
        disabled={loading}
        className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "✨ Structuring Clinical Note..."
          : "✨ Structure Clinical Note"}
      </button>

    </section>
  );
}