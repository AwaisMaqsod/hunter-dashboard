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
      }
      return token
    },
    session({ session, token }) {
      session.user.userId = token.userId as string
      session.user.apiKey = token.apiKey as string
      return session
    },
  },
}
