"use client";

import { useState } from "react";

import Header from "@/components/Header";
import PersonaSelector from "@/components/PersonaSelector";
import SearchBar from "@/components/SearchBar";
import WeatherCards from "@/components/WeatherCards";
import AIRecommendation from "@/components/AIRecommendation";

import {
  Assessment,
  City,
  Weather,
} from "@/types/climate";

export default function Home() {
  const [persona, setPersona] =
    useState("Construction Worker");

  const [weather, setWeather] =
    useState<Weather | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState("");

  async function handleAnalyze(city: City) {
    try {
      setLoading(true);
      setAssessment(null);

      setStatus("🌍 Retrieving live weather...");

      const weatherResponse = await fetch(
        `/api/weather?lat=${city.lat}&lon=${city.lon}`
      );

      const weatherData = await weatherResponse.json();

      setWeather(weatherData);

      setStatus(
        "🤖 Climate Pulse AI is generating your personalized safety assessment..."
      );

      const assessmentResponse = await fetch(
        "/api/assessment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            persona,
            weather: weatherData,
          }),
        }
      );

      const assessmentData =
        await assessmentResponse.json();

      setAssessment(assessmentData.assessment);

      setStatus("✅ Assessment complete!");
    } catch (err) {
      console.error(err);

      alert("Something went wrong.");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setStatus("");
      }, 600);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <PersonaSelector
          selectedPersona={persona}
          onPersonaChange={setPersona}
        />

        <SearchBar
          onAnalyze={handleAnalyze}
          loading={loading}
          status={status}
        />

        <WeatherCards weather={weather} />

        <AIRecommendation
          assessment={assessment}
        />
      </div>
    </main>
  );
}