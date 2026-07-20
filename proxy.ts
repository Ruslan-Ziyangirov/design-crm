import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isPublicApi = req.nextUrl.pathname.startsWith("/api/auth");

  if (isPublicApi) return NextResponse.next();

  if (!isLoggedIn && !isLoginPage) {
    const url = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isLoginPage) {
    const url = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
