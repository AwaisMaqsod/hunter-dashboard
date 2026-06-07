import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (!req.auth) {
    return Response.redirect(new URL("/login", req.url))
  }
})

export const config = {
  // /login is excluded here — middleware never runs on it, breaking any possible redirect loop
  matcher: [
    "/((?!login|api/auth|api/leads/sync|_next/static|_next/image|favicon\\.ico|public).*)",
  ],
}
