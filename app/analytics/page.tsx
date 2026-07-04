import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import { subDays, format, startOfDay } from "date-fns"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import LeadsLineChart from "@/components/analytics/LeadsLineChart"
import StatusPieChart from "@/components/analytics/StatusPieChart"
import CategoryBarChart from "@/components/analytics/CategoryBarChart"
import ConversionFunnel from "@/components/analytics/ConversionFunnel"
import { AnalyticsData } from "@/types"
import { DollarSign, TrendingUp, Users, Target } from "lucide-react"

const DEAL_VALUE = 499

async function getAnalyticsData(): Promise<AnalyticsData> {
  await connectDB()

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 29))

  const [leadsPerDayRaw, byStatusRaw, byCategoryRaw, funnelRaw] = await Promise.all([
    Lead.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: { isDeleted: false, category: { $ne: "" } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ])

  const dateMap = new Map<string, number>()
  for (const d of leadsPerDayRaw) dateMap.set(d._id, d.count)
  const leadsPerDay = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), "yyyy-MM-dd")
    return { date, count: dateMap.get(date) ?? 0 }
  })

  const byStatus = byStatusRaw.map((d) => ({ status: d._id, count: d.count }))
  const byCategory = byCategoryRaw.map((d) => ({ category: d._id, count: d.count }))

  const funnelMap = new Map<string, number>()
  for (const d of funnelRaw) funnelMap.set(d._id, d.count)
  const conversionFunnel = {
    new: funnelMap.get("new") ?? 0,
    contacted: funnelMap.get("contacted") ?? 0,
    interested: funnelMap.get("interested") ?? 0,
    closed: funnelMap.get("closed") ?? 0,
  }

  const totalRevenue = conversionFunnel.closed * DEAL_VALUE

  return { leadsPerDay, byStatus, byCategory, conversionFunnel, totalRevenue }
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const data = await getAnalyticsData()
  const totalLeads = data.byStatus.reduce((sum, s) => sum + s.count, 0)
  const conversionRate =
    data.conversionFunnel.new > 0
      ? ((data.conversionFunnel.closed / data.conversionFunnel.new) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        role={session.user.role}
      />

      <main className="flex-1 lg:ml-64 p-6">
        <TopBar title="Analytics" />

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-500">Total Leads</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalLeads.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-500">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{conversionRate}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-gray-500">Avg Deal Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${DEAL_VALUE}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-teal-500" />
              <span className="text-sm text-gray-500">Est. Revenue</span>
            </div>
            <p className="text-2xl font-bold text-teal-600">
              ${data.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <LeadsLineChart data={data.leadsPerDay} />
          <StatusPieChart data={data.byStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryBarChart data={data.byCategory} />
          <ConversionFunnel data={data.conversionFunnel} />
        </div>
      </main>
    </div>
  )
}
