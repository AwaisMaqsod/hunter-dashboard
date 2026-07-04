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

  const count = await Lead.countDocuments({})
  const result = await Lead.deleteMany({})

  console.log(`Deleted ${result.deletedCount} of ${count} leads.`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
