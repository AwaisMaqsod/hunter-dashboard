import mongoose, { Schema, Document, Model } from "mongoose"

export interface IBusinessInfo {
  ownerName: string
  agencyName: string
  email: string
  phone: string
  website: string
  tagline: string
}

export type UserRole = "admin" | "team"

export interface IUser extends Document {
  email: string
  password: string
  name: string
  apiKey: string
  role: UserRole
  isActive: boolean
  businessInfo: IBusinessInfo
  createdAt: Date
}

const BusinessInfoSchema = new Schema<IBusinessInfo>(
  {
    ownerName: { type: String, default: "" },
    agencyName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    tagline: { type: String, default: "" },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  apiKey: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ["admin", "team"], default: "admin" },
  isActive: { type: Boolean, default: true },
  businessInfo: { type: BusinessInfoSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
})

const User: Model<IUser> =
  (mongoose.models?.["User"] as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema)

export default User
