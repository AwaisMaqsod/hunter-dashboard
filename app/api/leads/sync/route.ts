import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import User from "@/models/User"
import { logActivity } from "@/lib/activity"

/** Lets the Chrome extension confirm which dashboard account an API key belongs to. */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ apiKey }).select("name email role isActive").lean()
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    return NextResponse.json({ name: user.name, email: user.email, role: user.role ?? "admin" })
  } catch (err) {
    console.error("Sync whoami error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ apiKey })
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await req.json()
    const leadsData: Record<string, unknown>[] = Array.isArray(body) ? body : [body]

    let inserted = 0
    let updated = 0
    let errors = 0

    for (const leadData of leadsData) {
      try {
        if (!leadData.mapsUrl || !leadData.businessName) {
          errors++
          continue
        }

        const existing = await Lead.findOne({ mapsUrl: leadData.mapsUrl })

        if (existing) {
          await Lead.updateOne(
            { mapsUrl: leadData.mapsUrl },
            {
              $set: {
                ...leadData,
                syncedBy: user._id,
                updatedAt: new Date(),
              },
              $push: {
                activityLog: {
                  action: "synced_from_extension",
                  note: "Re-synced from Chrome extension",
                  actorId: user._id.toString(),
                  actorName: user.name,
                  timestamp: new Date(),
                },
              },
            }
          )
          updated++
        } else {
          await Lead.create({
            ...leadData,
            source: "google_maps",
            addedBy: null,
            syncedBy: user._id,
            syncedFromExtension: true,
            activityLog: [
              {
                action: "synced_from_extension",
                note: "Synced from Chrome extension",
                actorId: user._id.toString(),
                actorName: user.name,
                timestamp: new Date(),
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          inserted++
        }
      } catch {
        errors++
      }
    }

    if (inserted + updated > 0) {
      await logActivity({
        userId: user._id.toString(),
        userName: user.name,
        userRole: user.role ?? "admin",
        action: "lead_synced",
        targetType: "Lead",
        targetId: "batch",
        description: `${user.name} synced ${inserted} new and ${updated} updated lead(s) from the Chrome extension`,
      })
    }

    return NextResponse.json({ success: true, inserted, updated, errors })
  } catch (err) {
    console.error("Sync error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
