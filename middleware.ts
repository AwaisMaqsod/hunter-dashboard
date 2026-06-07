import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/leads/sync")) {
    return undefined
  }

  if (!req.auth && pathname !== "/login") {
    return Response.redirect(new URL("/login", req.url))
  }

  if (req.auth && pathname === "/login") {
    return Response.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/((?!api/auth|api/leads/sync|_next/static|_next/image|favicon.ico|public).*)"],
}
