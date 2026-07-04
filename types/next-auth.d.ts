import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      userId: string
      apiKey: string
      role: "admin" | "team"
    } & DefaultSession["user"]
  }

  interface User {
    apiKey: string
    role: "admin" | "team"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    apiKey: string
    role: "admin" | "team"
  }
}
