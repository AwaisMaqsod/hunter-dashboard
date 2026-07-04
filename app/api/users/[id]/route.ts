import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { logActivity } from "@/lib/activity"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { id } = params
    const { role, isActive } = await req.json()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (role !== undefined && role !== user.role) {
      if (role !== "admin" && role !== "team") {
        return NextResponse.json({ error: "Role must be admin or team" }, { status: 400 })
      }
      if (user.role === "admin" && role === "team") {
        const adminCount = await User.countDocuments({ role: "admin" })
        if (adminCount <= 1) {
          return NextResponse.json({ error: "Cannot demote the last remaining admin" }, { status: 400 })
        }
      }
      const previousRole = user.role
      user.role = role
      await logActivity({
        userId: session.user.userId,
        userName: session.user.name ?? "Unknown",
        userRole: session.user.role,
        action: "user_role_changed",
        targetType: "User",
        targetId: user._id.toString(),
        description: `${session.user.name} changed ${user.name}'s role from ${previousRole} to ${role}`,
      })
    }

    if (isActive !== undefined && isActive !== user.isActive) {
      if (user.id === session.user.userId && isActive === false) {
        return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 })
      }
      if (user.role === "admin" && isActive === false) {
        const activeAdminCount = await User.countDocuments({ role: "admin", isActive: true })
        if (activeAdminCount <= 1) {
          return NextResponse.json({ error: "Cannot deactivate the last active admin" }, { status: 400 })
        }
      }
      user.isActive = isActive
      await logActivity({
        userId: session.user.userId,
        userName: session.user.name ?? "Unknown",
        userRole: session.user.role,
        action: "user_status_changed",
        targetType: "User",
        targetId: user._id.toString(),
        description: `${session.user.name} ${isActive ? "activated" : "deactivated"} ${user.name}'s account`,
      })
    }

    await user.save()

    const { password: _password, ...userWithoutPassword } = user.toObject()
    return NextResponse.json({ user: userWithoutPassword })
  } catch (err) {
    console.error("User PATCH error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const { id } = params

    if (id === session.user.userId) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" })
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last remaining admin" }, { status: 400 })
      }
    }

    await user.deleteOne()

    await logActivity({
      userId: session.user.userId,
      userName: session.user.name ?? "Unknown",
      userRole: session.user.role,
      action: "user_status_changed",
      targetType: "User",
      targetId: id,
      description: `${session.user.name} deleted ${user.name}'s account`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("User DELETE error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
