"use client";

import { Search, MapPin, Loader2, Brain } from "lucide-react";
import { useEffect, useState } from "react";

import { City } from "../types/climate";

type SearchBarProps = {
  onAnalyze: (city: City) => void;
  loading: boolean;
  status: string;
};

export default function SearchBar({
  onAnalyze,
  loading,
  status,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] =
    useState<City | null>(null);

  const [searchLoading, setSearchLoading] =
    useState(false);

  useEffect(() => {
    if (query.length < 2 || selectedCity) {
      setCities([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await fetch(
          `/api/search-city?q=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        setCities(data);
      } catch (error) {
        console.error(error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, selectedCity]);

  function handleAnalyze() {
    if (!selectedCity) {
      alert("Please select a city.");
      return;
    }

    onAnalyze(selectedCity);
  }

  return (
    <section className="mt-12 rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800">
        Where are you working today?
      </h2>

      <p className="mt-2 text-slate-600">
        Search and choose your city to analyze today's
        outdoor conditions.
      </p>

      <div className="mt-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedCity(null);
            }}
            placeholder="Example: Delhi, India"
            disabled={loading}
            className="w-full rounded-xl border border-slate-300 py-4 pl-12 pr-4 focus:border-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
          />

          {searchLoading && (
            <Loader2
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
              size={20}
            />
          )}

          {cities.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
              {cities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    setQuery(
                      `${city.name}, ${city.region}, ${city.country}`
                    );
                    setCities([]);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-100"
                >
                  <MapPin
                    size={18}
                    className="flex-shrink-0 text-sky-600"
                  />

                  <div>
                    <div className="font-medium">
                      {city.name}
                    </div>

                    <div className="text-sm text-slate-500">
                      {city.region}, {city.country}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          disabled={!selectedCity || loading}
          onClick={handleAnalyze}
          className="rounded-xl bg-sky-600 px-8 py-4 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2
                className="animate-spin"
                size={18}
              />
              Working...
            </span>
          ) : (
            "Analyze My Day"
          )}
        </button>
      </div>

      {selectedCity && (
        <div className="mt-6 rounded-xl bg-sky-50 p-4 text-sky-800">
          <strong>Selected:</strong>{" "}
          {selectedCity.name}, {selectedCity.region},{" "}
          {selectedCity.country}
        </div>
      )}

      {loading && (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-sky-100 p-3">
              <Brain
                className="text-sky-700"
                size={24}
              />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800">
                Climate Pulse AI is working...
              </h3>

              <p className="text-sm text-slate-600">
                Building your personalized outdoor safety
                assessment.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl bg-white p-4">
            <Loader2
              className="animate-spin text-sky-600"
              size={20}
            />

            <span className="font-medium text-slate-700">
              {status}
            </span>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            This usually takes 3–8 seconds depending on AI
            response time.
          </p>
        </div>
      )}
    </section>
  );
}