import mongoose from "mongoose"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import User from "../models/User"

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

  const roleResult = await User.updateMany(
    { role: { $exists: false } },
    { $set: { role: "admin" } }
  )
  const activeResult = await User.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  )

  console.log(`Backfilled role on ${roleResult.modifiedCount} user(s).`)
  console.log(`Backfilled isActive on ${activeResult.modifiedCount} user(s).`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
