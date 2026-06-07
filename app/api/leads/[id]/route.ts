import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = params
    const body = await req.json()
    const { status, notes, followUpDate, pitchSent } = body

    const lead = await Lead.findById(id)
    if (!lead || lead.isDeleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    const activityEntries: { action: string; note: string; timestamp: Date }[] = []

    if (status && status !== lead.status) {
      activityEntries.push({
        action: "status_changed",
        note: `Status changed: ${lead.status} → ${status}`,
        timestamp: new Date(),
      })
      lead.status = status
    }

    if (pitchSent !== undefined) {
      activityEntries.push({
        action: "pitch_sent",
        note: "Pitch email sent",
        timestamp: new Date(),
      })
      lead.pitchSent = pitchSent
    }

    if (notes !== undefined) lead.notes = notes
    if (followUpDate !== undefined) {
      lead.followUpDate = followUpDate ? new Date(followUpDate) : null
    }

    if (activityEntries.length > 0) {
      lead.activityLog.push(...activityEntries)
    }

    lead.updatedAt = new Date()
    await lead.save()

    return NextResponse.json({ lead })
  } catch (err) {
    console.error("Lead PATCH error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const lead = await Lead.findById(params.id)
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    lead.isDeleted = true
    lead.updatedAt = new Date()
    await lead.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Lead DELETE error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
