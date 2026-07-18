"use client";

import { useState } from "react";

export default function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(
    "Your answer will appear here..."
  );
  const [loading, setLoading] = useState(false);

  async function askQuestion() {
    if (!question.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      });

      const data = await res.json();

      setResponse(data.answer);
    } catch (error) {
      console.error(error);
      setResponse("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="text-2xl font-semibold text-white">
        Ask PolicyLens
      </h2>

      <p className="mt-2 text-zinc-400">
        Ask questions in any language.
      </p>

      <textarea
        rows={5}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Example: मेरी maternity leave कितनी है?"
        className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-white outline-none focus:border-blue-500"
      />

      <button
        onClick={askQuestion}
        disabled={loading}
        className="mt-4 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask"}
      </button>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h3 className="font-semibold text-white">
          Response
        </h3>

        <p className="mt-4 whitespace-pre-wrap text-zinc-300">
          {response}
        </p>
      </div>
    </div>
  );
}