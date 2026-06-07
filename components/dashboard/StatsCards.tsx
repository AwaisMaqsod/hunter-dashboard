import { Users, Target, MessageSquare, DollarSign } from "lucide-react"
import { StatsData } from "@/types"

interface StatsCardsProps {
  stats: StatsData
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Hot Leads",
      subtitle: "No website",
      value: stats.hotLeads.toLocaleString(),
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Contacted",
      value: stats.contacted.toLocaleString(),
      icon: MessageSquare,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Closed",
      value: stats.closed.toLocaleString(),
      icon: DollarSign,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.title}</p>
              {card.subtitle && (
                <p className="text-xs text-orange-500">{card.subtitle}</p>
              )}
            </div>
            <div className={`${card.bg} p-2 rounded-lg`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
