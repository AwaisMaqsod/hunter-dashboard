import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import User from "@/models/User"

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ apiKey })
    if (!user) {
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
                updatedAt: new Date(),
              },
              $push: {
                activityLog: {
                  action: "synced_from_extension",
                  note: "Re-synced from Chrome extension",
                  timestamp: new Date(),
                },
              },
            }
          )
          updated++
        } else {
          await Lead.create({
            ...leadData,
            syncedFromExtension: true,
            activityLog: [
              {
                action: "synced_from_extension",
                note: "Synced from Chrome extension",
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

    return NextResponse.json({ success: true, inserted, updated, errors })
  } catch (err) {
    console.error("Sync error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
