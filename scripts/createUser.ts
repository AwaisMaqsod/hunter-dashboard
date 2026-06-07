import * as readline from "readline/promises"
import { stdin as input, stdout as output } from "process"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"

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

async function main() {
  const rl = readline.createInterface({ input, output })

  console.log("\n🗺️  Lead Hunter — Create Admin User\n")

  const name = await rl.question("Name: ")
  const email = await rl.question("Email: ")
  const password = await rl.question("Password (min 8 chars): ")

  if (!name || !email || !password) {
    console.error("All fields are required.")
    rl.close()
    process.exit(1)
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.")
    rl.close()
    process.exit(1)
  }

  rl.close()

  console.log("\nConnecting to MongoDB...")
  await mongoose.connect(MONGODB_URI)

  const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    apiKey: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
  })

  const User = mongoose.models.User ?? mongoose.model("User", UserSchema)

  const existing = await User.findOne({ email })
  if (existing) {
    console.error(`\nError: A user with email "${email}" already exists.`)
    await mongoose.disconnect()
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const apiKey = `sk-${uuidv4().replace(/-/g, "")}`

  await User.create({
    name,
    email,
    password: hashedPassword,
    apiKey,
  })

  console.log(`\n✅ User created successfully!`)
  console.log(`   Name:    ${name}`)
  console.log(`   Email:   ${email}`)
  console.log(`   API Key: ${apiKey}`)
  console.log(`\n👉 Use this API Key in your Chrome Extension settings.`)
  console.log(`   Sync URL: http://localhost:3000/api/leads/sync\n`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
