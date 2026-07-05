import mongoose from "mongoose"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import User from "../models/User"
import Lead from "../models/Lead"
import Activity from "../models/Activity"

const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not set. Add it to .env.local")
  process.exit(1)
}

async function main() {
  await mongoose.connect(MONGODB_URI as string)

  const user = await User.findOne({ email: "awais@gmail.com" }).lean()
  if (!user) {
    console.log("No user found with email awais@gmail.com")
    await mongoose.disconnect()
    process.exit(0)
  }

  const leadResult = await Lead.deleteMany({
    $or: [{ addedBy: user._id }, { syncedBy: user._id }],
  })
  const activityResult = await Activity.deleteMany({ userId: user._id.toString() })

  console.log(`Deleted ${leadResult.deletedCount} leads for ${user.email}.`)
  console.log(`Deleted ${activityResult.deletedCount} activity records for ${user.email}.`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
