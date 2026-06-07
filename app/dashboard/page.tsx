import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import StatsCards from "@/components/dashboard/StatsCards"
import FilterBar from "@/components/dashboard/FilterBar"
import LeadsTable from "@/components/dashboard/LeadsTable"
import { Lead as LeadType, StatsData } from "@/types"

interface DashboardPageProps {
  searchParams: {
    page?: string
    status?: string
    hasWebsite?: string
    category?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    sortBy?: string
    sortOrder?: string
  }
}

async function getDashboardData(searchParams: DashboardPageProps["searchParams"]) {
  await connectDB()

  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const limit = 25
  const skip = (page - 1) * limit

  const filter: Record<string, unknown> = { isDeleted: false }

  if (searchParams.status && searchParams.status !== "all") {
    filter.status = searchParams.status
  }
  if (searchParams.hasWebsite === "true") filter.hasWebsite = true
  if (searchParams.hasWebsite === "false") filter.hasWebsite = false
  if (searchParams.category && searchParams.category !== "all") {
    filter.category = searchParams.category
  }
  if (searchParams.search) {
    filter.$or = [
      { businessName: { $regex: searchParams.search, $options: "i" } },
      { address: { $regex: searchParams.search, $options: "i" } },
    ]
  }
  if (searchParams.dateFrom || searchParams.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (searchParams.dateFrom) dateFilter.$gte = new Date(searchParams.dateFrom)
    if (searchParams.dateTo) {
      const end = new Date(searchParams.dateTo)
      end.setHours(23, 59, 59, 999)
      dateFilter.$lte = end
    }
    filter.createdAt = dateFilter
  }

  const sortField = searchParams.sortBy ?? "createdAt"
  const sortOrder = searchParams.sortOrder === "asc" ? 1 : -1
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder }

  const [leads, total, statsRaw, categoriesRaw, lastSynced] = await Promise.all([
    Lead.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
    Lead.aggregate([
      { $match: { isDeleted: false } },
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
    Lead.distinct("category", { isDeleted: false, category: { $ne: "" } }),
    Lead.findOne({ isDeleted: false }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
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

  return {
    leads: JSON.parse(JSON.stringify(leads)) as LeadType[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats,
    categories: categoriesRaw as string[],
    lastSyncedAt: lastSynced?.updatedAt?.toISOString() ?? null,
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  if (!session) redirect("/login")

  const { leads, total, page, totalPages, stats, categories, lastSyncedAt } =
    await getDashboardData(searchParams)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
      />

      <main className="flex-1 lg:ml-64 p-6">
        <TopBar title="Dashboard" lastSyncedAt={lastSyncedAt} />
        <StatsCards stats={stats} />

        <Suspense>
          <FilterBar categories={categories} />
        </Suspense>

        <Suspense>
          <LeadsTable
            leads={leads}
            total={total}
            page={page}
            totalPages={totalPages}
          />
        </Suspense>
      </main>
    </div>
  )
}
