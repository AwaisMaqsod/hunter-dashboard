import Link from "next/link"
import { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import StatsCards from "@/components/dashboard/StatsCards"
import ActivityFeed from "@/components/dashboard/ActivityFeed"
import { Button } from "@/components/ui/button"
import { getLeadVisibilityFilter } from "@/lib/leads"
import { StatsData } from "@/types"
import { ListChecks, BarChart2 } from "lucide-react"

async function getOverviewData(session: Session) {
  await connectDB()

  const visibility = getLeadVisibilityFilter(session)
  const baseMatch: Record<string, unknown> = { isDeleted: false, ...visibility }

  const [statsRaw, lastSynced] = await Promise.all([
    Lead.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          hotLeads: { $sum: { $cond: [{ $eq: ["$hasWebsite", false] }, 1, 0] } },
          contacted: { $sum: { $cond: [{ $eq: ["$status", "contacted"] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
        },
      },
    ]),
    Lead.findOne({ isDeleted: false, ...visibility })
      .sort({ updatedAt: -1 })
      .select("updatedAt")
      .lean(),
  ])

  const stats: StatsData = statsRaw[0]
    ? {
        totalLeads: statsRaw[0].totalLeads,
        hotLeads: statsRaw[0].hotLeads,
        contacted: statsRaw[0].contacted,
        closed: statsRaw[0].closed,
        lastSyncedAt: lastSynced?.updatedAt?.toISOString() ?? null,
      }
    : { totalLeads: 0, hotLeads: 0, contacted: 0, closed: 0, lastSyncedAt: null }

  return { stats, lastSyncedAt: lastSynced?.updatedAt?.toISOString() ?? null }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { stats, lastSyncedAt } = await getOverviewData(session)
  const isAdmin = session.user.role === "admin"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        role={session.user.role}
      />

      <main className="flex-1 lg:ml-64 p-6">
        <TopBar title="Dashboard" lastSyncedAt={lastSyncedAt} />
        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ActivityFeed isAdmin={isAdmin} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Quick Links</h2>
            <Link href="/leads">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ListChecks className="h-4 w-4" />
                Manage Leads
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BarChart2 className="h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
