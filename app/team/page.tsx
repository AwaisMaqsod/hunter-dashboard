import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Lead from "@/models/Lead"
import Activity from "@/models/Activity"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import UsersTable from "@/components/team/UsersTable"
import AddTeamMemberDialog from "@/components/team/AddTeamMemberDialog"
import { TeamUser } from "@/types"

async function getTeamData(): Promise<TeamUser[]> {
  await connectDB()

  const users = await User.find().select("-password").sort({ createdAt: -1 }).lean()

  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const [leadsAdded, lastActivity] = await Promise.all([
        Lead.countDocuments({ addedBy: user._id, isDeleted: false }),
        Activity.findOne({ userId: user._id.toString() }).sort({ createdAt: -1 }).lean(),
      ])
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        leadsAdded,
        lastActiveAt: lastActivity?.createdAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      }
    })
  )

  return usersWithStats
}

export default async function TeamPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  const users = await getTeamData()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        role={session.user.role}
      />

      <main className="flex-1 lg:ml-64 p-6">
        <TopBar title="Team" />

        <div className="flex justify-end mb-4">
          <AddTeamMemberDialog />
        </div>

        <UsersTable users={users} currentUserId={session.user.userId} />
      </main>
    </div>
  )
}
