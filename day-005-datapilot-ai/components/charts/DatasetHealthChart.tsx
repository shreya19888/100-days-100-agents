"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

type Props = {
  quality: number;
};

export default function DatasetHealthChart({
  quality,
}: Props) {
  const data = [
    {
      name: "Healthy",
      value: quality,
    },
    {
      name: "Issues",
      value: 100 - quality,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h2 className="mb-5 text-2xl font-bold">
        Dataset Health
      </h2>

      <div className="h-64">

        <ResponsiveContainer>

          <PieChart>

            <Pie
              data={data}
              innerRadius={70}
              outerRadius={100}
              dataKey="value"
            >
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

      <div className="mt-5 text-center">

        <p className="text-5xl font-black text-green-600">
          {quality}%
        </p>

        <p className="text-gray-500">
          Overall Data Health
        </p>

      </div>

    </div>
  );
}