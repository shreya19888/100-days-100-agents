"use client";

import { useEffect, useState } from "react";

const personas = [
  {
    id: "construction-worker",
    name: "Construction Worker",
    emoji: "👷",
    description: "Heavy outdoor labor on construction sites",
  },
  {
    id: "delivery-rider",
    name: "Delivery Rider",
    emoji: "🛵",
    description: "Long hours riding in changing weather",
  },
  {
    id: "farmer",
    name: "Farmer",
    emoji: "🌾",
    description: "Field work with prolonged sun exposure",
  },
  {
    id: "street-vendor",
    name: "Street Vendor",
    emoji: "🛒",
    description: "Working outdoors with limited shelter",
  },
  {
    id: "other",
    name: "Other",
    emoji: "🧑‍💼",
    description: "Choose this if your occupation isn't listed",
  },
];

type PersonaSelectorProps = {
  selectedPersona: string;
  onPersonaChange: (persona: string) => void;
};

export default function PersonaSelector({
  selectedPersona,
  onPersonaChange,
}: PersonaSelectorProps) {
  const [selectedCard, setSelectedCard] = useState(
    "construction-worker"
  );

  const [customOccupation, setCustomOccupation] =
    useState("");

  useEffect(() => {
    const selected = personas.find(
      (p) => p.id === selectedCard
    );

    if (!selected) return;

    if (selected.id !== "other") {
      onPersonaChange(selected.name);
    }
  }, [selectedCard, onPersonaChange]);

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800">
        Who are you?
      </h2>

      <p className="mt-2 text-slate-600">
        Select your occupation so Climate Pulse AI can
        personalize its safety recommendations.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {personas.map((persona) => (
          <button
            key={persona.id}
            type="button"
            onClick={() => setSelectedCard(persona.id)}
            className={`rounded-xl border p-5 text-left transition ${
              selectedCard === persona.id
                ? "border-sky-600 bg-sky-50"
                : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl">
              {persona.emoji}
            </div>

            <h3 className="mt-3 font-semibold text-slate-800">
              {persona.name}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {persona.description}
            </p>
          </button>
        ))}
      </div>

      {selectedCard === "other" && (
        <div className="mt-6">
          <label className="mb-2 block font-medium text-slate-700">
            Enter your occupation
          </label>

          <input
            type="text"
            value={customOccupation}
            placeholder="e.g. Landscaper"
            onChange={(e) => {
              setCustomOccupation(e.target.value);
              onPersonaChange(e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
          />
        </div>
      )}
    </section>
  );
}