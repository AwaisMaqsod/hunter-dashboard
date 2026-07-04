import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import User from "../models/User"

// Load .env.local
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
const mongoUri = MONGODB_URI as string

const SEED_USERS = [
  { name: "Kashif", email: "kashif@gmail.com", password: "12345678", role: "team" as const },
  { name: "Zain", email: "zain@gmail.com", password: "12345678", role: "team" as const },
]

async function main() {
  console.log("\n🌱 Seeding team users...\n")

  await mongoose.connect(mongoUri)

  for (const seedUser of SEED_USERS) {
    const existing = await User.findOne({ email: seedUser.email })
    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${seedUser.email}`)
      continue
    }

    const hashedPassword = await bcrypt.hash(seedUser.password, 12)
    const apiKey = `sk-${uuidv4().replace(/-/g, "")}`

    await User.create({
      name: seedUser.name,
      email: seedUser.email,
      password: hashedPassword,
      apiKey,
      role: seedUser.role,
    })

    console.log(`✅ Created ${seedUser.role}: ${seedUser.name} <${seedUser.email}>`)
  }

  console.log("\nDone.\n")
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
