import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string
        token.apiKey = (user as { apiKey: string }).apiKey
        token.role = (user as { role: "admin" | "team" }).role
      }
      return token
    },
    session({ session, token }) {
      session.user.userId = token.userId as string
      session.user.apiKey = token.apiKey as string
      session.user.role = token.role as "admin" | "team"
      return session
    },
  },
}
