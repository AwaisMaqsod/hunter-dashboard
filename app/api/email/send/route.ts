import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendPitchEmail, isGmailConfigured } from "@/lib/email"
import connectDB from "@/lib/mongodb"
import Lead from "@/models/Lead"
import User from "@/models/User"
import { logActivity } from "@/lib/activity"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!isGmailConfigured()) {
      return NextResponse.json(
        { error: "Gmail SMTP is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to your environment." },
        { status: 503 }
      )
    }

    const { leadId, to, subject, body } = await req.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "to, subject, and body are required" }, { status: 400 })
    }

    await connectDB()

    // Get sender name from business info
    const user = await User.findOne({ email: session.user.email })
      .select("businessInfo")
      .lean<{ businessInfo?: { ownerName?: string; agencyName?: string } }>()

    const fromName =
      user?.businessInfo?.agencyName ||
      user?.businessInfo?.ownerName ||
      session.user.name ||
      undefined

    await sendPitchEmail({ to, subject, body, fromName })

    // Update lead: mark pitch sent + activity log
    if (leadId) {
      const pitchText = `Subject: ${subject}\n\n${body}`
      const lead = await Lead.findByIdAndUpdate(leadId, {
        $set: { pitchSent: pitchText, updatedAt: new Date() },
        $push: {
          activityLog: {
            action: "pitch_sent",
            note: `Email sent to ${to}`,
            actorId: session.user.userId,
            actorName: session.user.name ?? "Unknown",
            timestamp: new Date(),
          },
        },
      })

      await logActivity({
        userId: session.user.userId,
        userName: session.user.name ?? "Unknown",
        userRole: session.user.role,
        action: "pitch_sent",
        targetType: "Lead",
        targetId: leadId,
        description: `${session.user.name} sent a pitch email to ${to}${
          lead ? ` for "${lead.businessName}"` : ""
        }`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("Email send error:", err)
    const message = err instanceof Error ? err.message : "Failed to send email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
