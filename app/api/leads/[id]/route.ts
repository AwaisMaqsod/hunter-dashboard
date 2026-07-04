import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import { getLeadVisibilityFilter } from "@/lib/leads"
import { logActivity } from "@/lib/activity"

function canAccessLead(
  lead: { source: string; addedBy: unknown },
  role: "admin" | "team",
  userId: string
) {
  if (role === "admin") return true
  return lead.source === "google_maps" || lead.addedBy?.toString() === userId
}

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

    if (!canAccessLead(lead, session.user.role, session.user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const actor = { actorId: session.user.userId, actorName: session.user.name ?? "Unknown" }
    const activityEntries: {
      action: string
      note: string
      actorId: string
      actorName: string
      timestamp: Date
    }[] = []

    if (status && status !== lead.status) {
      activityEntries.push({
        action: "status_changed",
        note: `Status changed: ${lead.status} → ${status}`,
        ...actor,
        timestamp: new Date(),
      })
      lead.status = status
    }

    if (pitchSent !== undefined) {
      activityEntries.push({
        action: "pitch_sent",
        note: "Pitch email sent",
        ...actor,
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

    for (const entry of activityEntries) {
      await logActivity({
        userId: session.user.userId,
        userName: session.user.name ?? "Unknown",
        userRole: session.user.role,
        action: entry.action as "status_changed" | "pitch_sent",
        targetType: "Lead",
        targetId: lead._id.toString(),
        description: `${session.user.name} ${
          entry.action === "status_changed" ? entry.note.toLowerCase() : "sent a pitch email"
        } for "${lead.businessName}"`,
      })
    }

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

    if (!canAccessLead(lead, session.user.role, session.user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    lead.isDeleted = true
    lead.updatedAt = new Date()
    await lead.save()

    await logActivity({
      userId: session.user.userId,
      userName: session.user.name ?? "Unknown",
      userRole: session.user.role,
      action: "lead_deleted",
      targetType: "Lead",
      targetId: lead._id.toString(),
      description: `${session.user.name} deleted "${lead.businessName}"`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Lead DELETE error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
