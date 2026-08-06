"use client";

import { useEffect, useState } from "react";
import type { DatasetMetadata } from "@/lib/datasets/types";

type Question = {
  id: number;
  question: string;
  options?: string[];
};

type QuizResponse = {
  questions: Question[];
};

type GradeResponse = {
  score: number;
  total: number;
  feedback: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  dataset: DatasetMetadata;
};

export default function QuizModal({
  open,
  onClose,
  dataset,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setResult(null);
    setAnswers({});

    fetch("/api/datahub/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "generate",
        dataset,
      }),
    })
      .then((r) => r.json())
      .then((data: QuizResponse) => {
        setQuestions(data.questions || []);
      })
      .finally(() => setLoading(false));
  }, [open, dataset]);

  async function submitQuiz() {
    setLoading(true);

    const response = await fetch("/api/datahub/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "grade",
        dataset,
        questions,
        answers,
      }),
    });

    const grade: GradeResponse = await response.json();

    setResult(grade);
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-[720px] overflow-y-auto bg-white shadow-2xl">

        <div className="sticky top-0 border-b bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                📝 AI Knowledge Quiz
              </h2>

              <p className="text-gray-500 mt-1">
                {dataset.title}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border px-4 py-2 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-8">

          {loading && (
            <div className="py-20 text-center">
              <div className="text-5xl">🤖</div>

              <p className="mt-4 text-lg">
                AI is preparing your quiz...
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="space-y-8">

              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border p-6"
                >
                  <h3 className="font-semibold text-lg">
                    {q.id}. {q.question}
                  </h3>

                  {q.options ? (
                    <div className="mt-5 space-y-3">

                      {q.options.map((option) => (
                        <label
                          key={option}
                          className="flex gap-3 rounded-lg border p-3 hover:bg-slate-50"
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={option}
                            checked={answers[q.id] === option}
                            onChange={() =>
                              setAnswers({
                                ...answers,
                                [q.id]: option,
                              })
                            }
                          />

                          {option}
                        </label>
                      ))}

                    </div>
                  ) : (
                    <textarea
                      rows={4}
                      className="mt-4 w-full rounded-lg border p-3"
                      placeholder="Type your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [q.id]: e.target.value,
                        })
                      }
                    />
                  )}

                </div>
              ))}

              <button
                onClick={submitQuiz}
                className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700"
              >
                Submit Quiz
              </button>

            </div>
          )}

          {result && (
            <div>

              <div className="rounded-2xl bg-green-50 p-8 text-center">

                <div className="text-6xl">
                  🎉
                </div>

                <h3 className="mt-4 text-3xl font-bold">
                  {result.score}/{result.total}
                </h3>

                <p className="mt-2 text-gray-600">
                  Great job!
                </p>

              </div>

              <div className="mt-8 space-y-4">

                {result.feedback.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border p-5"
                  >
                    {item}
                  </div>
                ))}

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}