import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      userId: string
      apiKey: string
    } & DefaultSession["user"]
  }

  interface User {
    apiKey: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    apiKey: string
  }
}
