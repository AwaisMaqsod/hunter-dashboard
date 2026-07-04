import mongoose from "mongoose"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import Lead from "../models/Lead"

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

  // Leads created before the source/platform/addedBy fields existed all came in through
  // the Chrome extension sync route, so they're backfilled as "google_maps" with no owner.
  const sourceResult = await Lead.updateMany(
    { source: { $exists: false } },
    { $set: { source: "google_maps", addedBy: null, platform: null } }
  )

  console.log(`Backfilled source on ${sourceResult.modifiedCount} lead(s).`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
