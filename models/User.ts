import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  email: string
  password: string
  name: string
  apiKey: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  apiKey: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
})

const User: Model<IUser> =
  (mongoose.models?.["User"] as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema)

export default User
