"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface CategoryBarChartProps {
  data: { category: string; count: number }[]
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
  const top10 = [...data].sort((a, b) => b.count - a.count).slice(0, 10)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Top 10 Categories</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={top10}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={110}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          />
          <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} name="Leads" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
