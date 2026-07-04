import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

/**
 * Lets the Chrome extension exchange an email/password for the account's API key,
 * so team members can "log in" from the popup instead of copy-pasting a raw key.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email }).lean<{
      _id: { toString(): string }
      email: string
      name: string
      password: string
      apiKey: string
      role: "admin" | "team"
      isActive: boolean
    }>()

    if (!user || user.isActive === false) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    return NextResponse.json({
      apiKey: user.apiKey,
      name: user.name,
      email: user.email,
      role: user.role ?? "admin",
    })
  } catch (err) {
    console.error("Extension login error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
