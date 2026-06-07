import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { v4 as uuidv4 } from "uuid"

export async function POST(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const newApiKey = `sk-${uuidv4().replace(/-/g, "")}`
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { apiKey: newApiKey },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ apiKey: newApiKey })
  } catch (err) {
    console.error("Regenerate key error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
