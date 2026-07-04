import mongoose, { Schema, Document, Model } from "mongoose"

export interface IActivityEntry {
  action: string
  note: string
  actorId: string | null
  actorName: string | null
  timestamp: Date
}

export type LeadSource = "google_maps" | "manual"

export interface ILead extends Document {
  businessName: string
  category: string
  address: string
  phone: string
  website: string | null
  email: string | null
  instagram: string | null
  facebook: string | null
  rating: number
  reviewCount: number
  mapsUrl: string
  hasWebsite: boolean
  status: "new" | "contacted" | "interested" | "closed" | "lost"
  notes: string
  pitchSent: string | null
  followUpDate: Date | null
  searchKeyword: string
  syncedFromExtension: boolean
  isDeleted: boolean
  source: LeadSource
  platform: string | null
  addedBy: mongoose.Types.ObjectId | null
  syncedBy: mongoose.Types.ObjectId | null
  activityLog: IActivityEntry[]
  createdAt: Date
  updatedAt: Date
}

const ActivityEntrySchema = new Schema<IActivityEntry>(
  {
    action: String,
    note: String,
    actorId: { type: String, default: null },
    actorName: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
)

const LeadSchema = new Schema<ILead>({
  businessName: { type: String, required: true },
  category: { type: String, default: "" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  website: { type: String, default: null },
  email: { type: String, default: null },
  instagram: { type: String, default: null },
  facebook: { type: String, default: null },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  mapsUrl: { type: String, unique: true, required: true },
  hasWebsite: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["new", "contacted", "interested", "closed", "lost"],
    default: "new",
  },
  notes: { type: String, default: "" },
  pitchSent: { type: String, default: null },
  followUpDate: { type: Date, default: null },
  searchKeyword: { type: String, default: "" },
  syncedFromExtension: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  source: { type: String, enum: ["google_maps", "manual"], default: "google_maps" },
  platform: { type: String, default: null },
  addedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  syncedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  activityLog: [ActivityEntrySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const Lead: Model<ILead> =
  (mongoose.models?.["Lead"] as Model<ILead>) ?? mongoose.model<ILead>("Lead", LeadSchema)

export default Lead
