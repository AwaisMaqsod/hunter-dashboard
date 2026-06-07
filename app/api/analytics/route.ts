import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import { subDays, format, startOfDay } from "date-fns"

const DEAL_VALUE = 499

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const thirtyDaysAgo = subDays(new Date(), 29)

    const [
      leadsPerDayRaw,
      byStatusRaw,
      byCategoryRaw,
      funnelRaw,
    ] = await Promise.all([
      Lead.aggregate([
        {
          $match: {
            isDeleted: false,
            createdAt: { $gte: startOfDay(thirtyDaysAgo) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
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
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ])

    // Fill in missing days for the last 30 days
    const dateMap = new Map<string, number>()
    for (const d of leadsPerDayRaw) {
      dateMap.set(d._id, d.count)
    }
    const leadsPerDay = Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), "yyyy-MM-dd")
      return { date, count: dateMap.get(date) ?? 0 }
    })

    const byStatus = byStatusRaw.map((d) => ({ status: d._id, count: d.count }))
    const byCategory = byCategoryRaw.map((d) => ({ category: d._id, count: d.count }))

    const funnelMap = new Map<string, number>()
    for (const d of funnelRaw) {
      funnelMap.set(d._id, d.count)
    }
    const conversionFunnel = {
      new: funnelMap.get("new") ?? 0,
      contacted: funnelMap.get("contacted") ?? 0,
      interested: funnelMap.get("interested") ?? 0,
      closed: funnelMap.get("closed") ?? 0,
    }

    const totalRevenue = conversionFunnel.closed * DEAL_VALUE

    return NextResponse.json({
      leadsPerDay,
      byStatus,
      byCategory,
      conversionFunnel,
      totalRevenue,
    })
  } catch (err) {
    console.error("Analytics error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
