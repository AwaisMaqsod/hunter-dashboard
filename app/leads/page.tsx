import { Suspense } from "react"
import { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import FilterBar from "@/components/dashboard/FilterBar"
import LeadsTable from "@/components/dashboard/LeadsTable"
import { getLeadVisibilityFilter, serializeLeadsWithOwner } from "@/lib/leads"
import { Lead as LeadType } from "@/types"

export const dynamic = "force-dynamic"

interface LeadsPageProps {
  searchParams: {
    page?: string
    status?: string
    hasWebsite?: string
    category?: string
    source?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    sortBy?: string
    sortOrder?: string
  }
}

async function getLeadsData(searchParams: LeadsPageProps["searchParams"], session: Session) {
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
  if (searchParams.source && searchParams.source !== "all") {
    filter.source = searchParams.source
  }

  const andClauses: Record<string, unknown>[] = []
  if (searchParams.search) {
    andClauses.push({
      $or: [
        { businessName: { $regex: searchParams.search, $options: "i" } },
        { address: { $regex: searchParams.search, $options: "i" } },
      ],
    })
  }
  const visibility = getLeadVisibilityFilter(session)
  if (Object.keys(visibility).length > 0) andClauses.push(visibility)
  if (andClauses.length > 0) filter.$and = andClauses

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

  const [leads, total, categoriesRaw, lastSynced] = await Promise.all([
    Lead.find(filter)
      .populate({ path: "addedBy", select: "name" })
      .populate({ path: "syncedBy", select: "name" })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
    Lead.distinct("category", { isDeleted: false, category: { $ne: "" } }),
    Lead.findOne({ isDeleted: false }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
  ])

  return {
    leads: JSON.parse(JSON.stringify(serializeLeadsWithOwner(leads))) as LeadType[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
    categories: categoriesRaw as string[],
    lastSyncedAt: lastSynced?.updatedAt?.toISOString() ?? null,
  }
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const session = await auth()
  if (!session) redirect("/login")

  const { leads, total, page, totalPages, categories, lastSyncedAt } = await getLeadsData(
    searchParams,
    session
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        role={session.user.role}
      />

      <main className="flex-1 min-w-0 lg:ml-64 p-6">
        <TopBar title="Leads" lastSyncedAt={lastSyncedAt} />

        <Suspense>
          <FilterBar categories={categories} />
        </Suspense>

        <Suspense>
          <LeadsTable
            leads={leads}
            total={total}
            page={page}
            totalPages={totalPages}
            currentUserId={session.user.userId}
            role={session.user.role}
          />
        </Suspense>
      </main>
    </div>
  )
}
