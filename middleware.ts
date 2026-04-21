import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/dashboard")       ||
    pathname.startsWith("/assessments")     ||
    pathname.startsWith("/settings")        ||
    pathname.startsWith("/settings")        ||
    pathname.startsWith("/courses")         ||
    pathname.startsWith("/quizzes")         ||
    pathname.startsWith("/statistics")      ||
    pathname.startsWith("/chatbot")         ||
    pathname.startsWith("/admin")           ||
    pathname.startsWith("/pre-assessment")  ||
    pathname.startsWith("/reset-password"); 

  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assessments/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};