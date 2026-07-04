import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import connectDB from "./mongodb"
import User from "@/models/User"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()
        const user = await User.findOne({ email: credentials.email }).lean<{
          _id: { toString(): string }
          email: string
          name: string
          password: string
          apiKey: string
          role: "admin" | "team"
          isActive: boolean
        }>()

        if (!user || user.isActive === false) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!isValid) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          apiKey: user.apiKey,
          role: user.role ?? "admin",
        }
      },
    }),
  ],
})
