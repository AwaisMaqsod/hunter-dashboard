import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Activity from "@/models/Activity"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
    const requestedUserId = searchParams.get("userId")

    const filter: Record<string, unknown> = {}
    if (session.user.role === "admin") {
      if (requestedUserId) filter.userId = requestedUserId
    } else {
      filter.userId = session.user.userId
    }

    const activity = await Activity.find(filter).sort({ createdAt: -1 }).limit(limit).lean()

    return NextResponse.json({ activity })
  } catch (err) {
    console.error("Activity GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
