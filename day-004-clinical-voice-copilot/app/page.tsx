"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import SoapViewer from "@/components/SoapViewer";

type Soap = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [soap, setSoap] = useState<Soap | null>(null);

  async function handleTranscript(text: string) {
    console.log("Received transcript:", text);
    setTranscript(text);

    try {
      setLoading(true);

      const response = await fetch("/api/clinical/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate SOAP note.");
      }

      const data = await response.json();

      setSoap(data.soap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl p-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold">
            Clinical Voice Copilot
          </h1>

          <p className="mt-3 text-lg text-zinc-400">
            AI-powered medical documentation assistant.
          </p>
        </div>

        {/* Recorder */}
        <div className="mb-10">
          <AudioRecorder
            onTranscript={handleTranscript}
          />
        </div>

        {/* Transcript + SOAP */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Transcript */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-2xl font-semibold">📝 Transcript</h2>

            {loading ? (
              <div className="space-y-4">
                <p className="animate-pulse text-blue-400">
                  🎙 Processing clinical encounter...
                </p>

                <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-7 text-zinc-300">
                {transcript ||
                  "Start recording to generate a transcript..."}
              </p>
            )}
          </div>

          {/* SOAP */}
          <SoapViewer soap={soap} />
        </div>
      </div>
    </main>
  );
}