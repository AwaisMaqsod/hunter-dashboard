import mongoose, { Schema, Document, Model } from "mongoose"

export type ActivityAction =
  | "lead_added_manual"
  | "lead_synced"
  | "status_changed"
  | "notes_updated"
  | "pitch_sent"
  | "follow_up_logged"
  | "lead_deleted"
  | "user_created"
  | "user_role_changed"
  | "user_status_changed"

export interface IActivity extends Document {
  userId: string
  userName: string
  userRole: string
  action: ActivityAction
  targetType: "Lead" | "User"
  targetId: string
  description: string
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ["Lead", "User"], required: true },
  targetId: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

ActivitySchema.index({ createdAt: -1 })
ActivitySchema.index({ userId: 1, createdAt: -1 })

const Activity: Model<IActivity> =
  (mongoose.models?.["Activity"] as Model<IActivity>) ??
  mongoose.model<IActivity>("Activity", ActivitySchema)

export default Activity
