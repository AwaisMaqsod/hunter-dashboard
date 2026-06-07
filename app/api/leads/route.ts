import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25"))
    const status = searchParams.get("status")
    const hasWebsite = searchParams.get("hasWebsite")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const sortBy = searchParams.get("sortBy") ?? "createdAt"
    const sortOrder = searchParams.get("sortOrder") ?? "desc"

    const filter: Record<string, unknown> = { isDeleted: false }

    if (status && status !== "all") filter.status = status
    if (hasWebsite === "true") filter.hasWebsite = true
    if (hasWebsite === "false") filter.hasWebsite = false
    if (category && category !== "all") filter.category = category

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ]
    }

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.$gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        dateFilter.$lte = end
      }
      filter.createdAt = dateFilter
    }

    const validSortFields = ["createdAt", "businessName", "rating", "updatedAt"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === "asc" ? 1 : -1 }

    const skip = (page - 1) * limit
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ])

    return NextResponse.json({
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error("Leads GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
