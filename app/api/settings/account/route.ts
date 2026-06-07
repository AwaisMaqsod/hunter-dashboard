import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { name, currentPassword, newPassword } = await req.json()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password required to set a new password" },
          { status: 400 }
        )
      }
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
      user.password = await bcrypt.hash(newPassword, 12)
    }

    if (name) user.name = name
    await user.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Account update error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
