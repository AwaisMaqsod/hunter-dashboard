import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import { getLeadVisibilityFilter, serializeLeadsWithOwner } from "@/lib/leads"
import { logActivity } from "@/lib/activity"

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
    const source = searchParams.get("source")
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
    if (source && source !== "all") filter.source = source

    const andClauses: Record<string, unknown>[] = []

    if (search) {
      andClauses.push({
        $or: [
          { businessName: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
        ],
      })
    }

    const visibility = getLeadVisibilityFilter(session)
    if (Object.keys(visibility).length > 0) andClauses.push(visibility)

    if (andClauses.length > 0) filter.$and = andClauses

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
      Lead.find(filter)
        .populate({ path: "addedBy", select: "name" })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter),
    ])

    return NextResponse.json({
      leads: serializeLeadsWithOwner(leads),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error("Leads GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const {
      businessName,
      category,
      address,
      phone,
      email,
      website,
      instagram,
      facebook,
      platform,
      notes,
    } = body

    if (!businessName || typeof businessName !== "string") {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 })
    }

    const lead = await Lead.create({
      businessName,
      category: category ?? "",
      address: address ?? "",
      phone: phone ?? "",
      email: email || null,
      website: website || null,
      instagram: instagram || null,
      facebook: facebook || null,
      hasWebsite: Boolean(website),
      notes: notes ?? "",
      mapsUrl: `manual:${session.user.userId}:${Date.now()}`,
      source: "manual",
      platform: platform || "Other",
      addedBy: session.user.userId,
      syncedFromExtension: false,
      activityLog: [
        {
          action: "lead_added_manual",
          note: `Lead added manually via ${platform || "Other"}`,
          actorId: session.user.userId,
          actorName: session.user.name ?? "Unknown",
          timestamp: new Date(),
        },
      ],
    })

    await logActivity({
      userId: session.user.userId,
      userName: session.user.name ?? "Unknown",
      userRole: session.user.role,
      action: "lead_added_manual",
      targetType: "Lead",
      targetId: lead._id.toString(),
      description: `${session.user.name} added "${businessName}" from ${platform || "Other"}`,
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (err) {
    console.error("Leads POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
