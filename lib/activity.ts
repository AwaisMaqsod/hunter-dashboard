import connectDB from "./mongodb"
import Activity, { ActivityAction } from "@/models/Activity"

interface LogActivityParams {
  userId: string
  userName: string
  userRole: string
  action: ActivityAction
  targetType: "Lead" | "User"
  targetId: string
  description: string
}

export async function logActivity(params: LogActivityParams) {
  await connectDB()
  await Activity.create(params)
  return { actorId: params.userId, actorName: params.userName }
}
