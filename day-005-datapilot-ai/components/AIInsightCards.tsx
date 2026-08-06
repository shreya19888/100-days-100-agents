"use client";

type Props = {
  answer: string;
};

function extract(answer: string, title: string) {
  const regex = new RegExp(
    `##\\s*${title}([\\s\\S]*?)(?=##|$)`,
    "i"
  );

  const match = answer.match(regex);

  return match?.[1]?.trim() ?? "";
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">
        {title}
      </h2>

      <div className="whitespace-pre-wrap leading-7 text-gray-700">
        {children}
      </div>
    </div>
  );
}

export default function AIInsightCards({
  answer,
}: Props) {
  return (
    <div className="space-y-6">

      <Card title="🏢 Business Purpose">
        {extract(answer, "What Business Problem This Dataset Solves")}
      </Card>

      <Card title="📦 Dataset Contents">
        {extract(answer, "What Data It Contains")}
      </Card>

      <Card title="⬆ Upstream Systems">
        {extract(answer, "Typical Upstream Sources")}
      </Card>

      <Card title="⬇ Downstream Consumers">
        {extract(answer, "Typical Downstream Consumers")}
      </Card>

      <Card title="💻 SQL & Joins">
        {extract(answer, "Common SQL Joins")}
      </Card>

      <Card title="✅ Data Quality">
        {extract(answer, "Data Quality Checks")}
      </Card>

      <Card title="🔒 Governance">
        {extract(answer, "Governance Considerations")}
      </Card>

      <Card title="💡 Tips for New Engineers">
        {extract(answer, "Tips for a New Engineer")}
      </Card>

    </div>
  );
}