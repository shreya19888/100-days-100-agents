"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = {
  upstream: number;
  downstream: number;
};

export default function LineageActivityChart({
  upstream,
  downstream,
}: Props) {
  const data = [
    {
      name: "Upstream",
      datasets: upstream,
    },
    {
      name: "Downstream",
      datasets: downstream,
    },
  ];

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h2 className="mb-5 text-2xl font-bold">
        Lineage Overview
      </h2>

      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="datasets"
              radius={[8, 8, 0, 0]}
              fill="#2563eb"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}