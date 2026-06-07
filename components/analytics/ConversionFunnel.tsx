interface ConversionFunnelProps {
  data: {
    new: number
    contacted: number
    interested: number
    closed: number
  }
}

export default function ConversionFunnel({ data }: ConversionFunnelProps) {
  const stages = [
    { label: "New", value: data.new, color: "bg-blue-500", textColor: "text-blue-700", bg: "bg-blue-50" },
    { label: "Contacted", value: data.contacted, color: "bg-yellow-500", textColor: "text-yellow-700", bg: "bg-yellow-50" },
    { label: "Interested", value: data.interested, color: "bg-green-500", textColor: "text-green-700", bg: "bg-green-50" },
    { label: "Closed", value: data.closed, color: "bg-teal-500", textColor: "text-teal-700", bg: "bg-teal-50" },
  ]

  const maxWidth = [100, 78, 58, 40]
  const top = data.new || 1

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-6">Conversion Funnel</h3>
      <div className="flex flex-col items-center gap-1">
        {stages.map((stage, i) => {
          const pct = Math.round((stage.value / top) * 100)
          return (
            <div key={stage.label} className="w-full flex flex-col items-center gap-1">
              <div
                className={`${stage.bg} rounded-lg flex items-center justify-between px-5 py-3 transition-all`}
                style={{ width: `${maxWidth[i]}%` }}
              >
                <span className={`text-sm font-semibold ${stage.textColor}`}>
                  {stage.label}
                </span>
                <div className="text-right">
                  <p className={`text-lg font-bold ${stage.textColor}`}>
                    {stage.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{pct}% of new</p>
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-200" />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {data.new > 0 ? ((data.closed / data.new) * 100).toFixed(1) : "0.0"}%
          </p>
          <p className="text-xs text-gray-500">Overall Conversion Rate</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-teal-600">{data.closed.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Closed</p>
        </div>
      </div>
    </div>
  )
}
