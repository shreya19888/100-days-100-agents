"use client";

type Props = {
  answer: string;
};

function section(title: string, body: string) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <p className="whitespace-pre-wrap text-gray-700 leading-7">
        {body}
      </p>
    </div>
  );
}

export default function AIResponse({ answer }: Props) {
  if (!answer) return null;

  const parts = answer.split("---");

  return (
    <div className="mt-8 space-y-6">

      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold">
          AI Dataset Assistant
        </h1>

        <p className="mt-2 opacity-90">
          Enterprise Knowledge Summary
        </p>
      </div>

      {parts.map((part, index) => {
        const lines = part.trim().split("\n");

        if (!lines.length) return null;

        const title = lines[0].replaceAll("#", "").trim();

        const body = lines.slice(1).join("\n");

        return (
          <div key={index}>
            {section(title, body)}
          </div>
        );
      })}
    </div>
  );
}