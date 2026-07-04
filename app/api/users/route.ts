import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Lead from "@/models/Lead"
import Activity from "@/models/Activity"
import { logActivity } from "@/lib/activity"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean()

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [leadsAdded, lastActivity] = await Promise.all([
          Lead.countDocuments({ addedBy: user._id, isDeleted: false }),
          Activity.findOne({ userId: user._id.toString() }).sort({ createdAt: -1 }).lean(),
        ])
        return {
          ...user,
          leadsAdded,
          lastActiveAt: lastActivity?.createdAt ?? null,
        }
      })
    )

    return NextResponse.json({ users: usersWithStats })
  } catch (err) {
    console.error("Users GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { name, email, password, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    if (role !== "admin" && role !== "team") {
      return NextResponse.json({ error: "Role must be admin or team" }, { status: 400 })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const apiKey = `sk-${uuidv4().replace(/-/g, "")}`

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      apiKey,
      role,
    })

    await logActivity({
      userId: session.user.userId,
      userName: session.user.name ?? "Unknown",
      userRole: session.user.role,
      action: "user_created",
      targetType: "User",
      targetId: user._id.toString(),
      description: `${session.user.name} created ${role} account for ${name}`,
    })

    const { password: _password, ...userWithoutPassword } = user.toObject()
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
  } catch (err) {
    console.error("Users POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
