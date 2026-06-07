import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).select("businessInfo").lean<{
      businessInfo: {
        ownerName: string
        agencyName: string
        email: string
        phone: string
        website: string
        tagline: string
      }
    }>()

    return NextResponse.json({ businessInfo: user?.businessInfo ?? {} })
  } catch (err) {
    console.error("Business GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const body = await req.json()

    const allowed = ["ownerName", "agencyName", "email", "phone", "website", "tagline"]
    const update: Record<string, string> = {}
    for (const key of allowed) {
      if (key in body) update[`businessInfo.${key}`] = body[key]
    }

    await User.updateOne({ email: session.user.email }, { $set: update })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Business PATCH error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
