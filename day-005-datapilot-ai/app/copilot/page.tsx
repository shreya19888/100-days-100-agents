"use client";

import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Explain Employee Master",
  "Generate SQL for Payroll",
  "Show common joins for Expense Reports",
  "Who owns Campaign Performance?",
  "Explain Customer Segments",
  "How is API Metrics used?",
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `# 👋 Welcome to DataPilot AI

I'm your enterprise data engineering assistant.

I can help you with:

- Dataset documentation
- SQL generation
- Data lineage
- Governance
- Data quality
- Learning recommendations
- Business context`,
    },
  ]);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(question: string) {
    if (!question.trim()) return;

    const history = [
      ...messages,
      {
        role: "user" as const,
        content: question,
      },
    ];

    setMessages(history);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/datahub/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset: question,
        }),
      });

      const data = await res.json();

      setMessages([
        ...history,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch {
      setMessages([
        ...history,
        {
          role: "assistant",
          content: "Unable to contact the AI service.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <main className="flex h-screen bg-slate-100">

      <aside className="w-80 border-r bg-slate-900 text-white">

        <div className="border-b border-slate-700 p-6">

          <h2 className="text-3xl font-black">
            DataPilot AI
          </h2>

          <p className="mt-2 text-slate-300">
            Enterprise Data Copilot
          </p>

        </div>

        <div className="p-6">

          <p className="mb-4 text-xs uppercase tracking-wider text-slate-400">
            Suggested Questions
          </p>

          <div className="space-y-3">

            {suggestions.map((item) => (

              <button
                key={item}
                onClick={() => send(item)}
                className="w-full rounded-xl bg-slate-800 p-3 text-left hover:bg-slate-700"
              >
                {item}
              </button>

            ))}

          </div>

        </div>

      </aside>

      <div className="flex flex-1 flex-col">

        <header className="border-b bg-white px-8 py-5">

          <h1 className="text-3xl font-black">
            Enterprise AI Assistant
          </h1>

        </header>

        <div className="flex-1 overflow-y-auto p-8">

          <div className="mx-auto max-w-5xl space-y-8">

            {messages.map((message, index) => (

              <div
                key={index}
                className={`rounded-3xl shadow-sm ${
                  message.role === "assistant"
                    ? "bg-white p-8"
                    : "ml-auto max-w-xl bg-blue-600 p-6 text-white"
                }`}
              >

                {message.role === "assistant" ? (
                  <MarkdownRenderer
                    content={message.content}
                  />
                ) : (
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}

              </div>

            ))}

            {loading && (

              <div className="rounded-3xl bg-white p-8 shadow-sm">

                <div className="mb-4 h-6 w-56 animate-pulse rounded bg-slate-200" />

                <div className="mb-2 h-4 animate-pulse rounded bg-slate-200" />

                <div className="mb-2 h-4 animate-pulse rounded bg-slate-200" />

                <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-slate-200" />

              </div>

            )}

          </div>

        </div>

        <footer className="border-t bg-white p-6">

          <div className="mx-auto flex max-w-5xl gap-4">

            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  send(prompt);
                }
              }}
              placeholder="Ask about enterprise datasets..."
              className="flex-1 rounded-xl border p-4"
            />

            <button
              onClick={() => send(prompt)}
              className="rounded-xl bg-blue-600 px-8 text-white hover:bg-blue-700"
            >
              Send
            </button>

          </div>

        </footer>

      </div>

    </main>
  );
}