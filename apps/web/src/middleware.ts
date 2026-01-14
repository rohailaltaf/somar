import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Use Node.js runtime instead of Edge (required for Prisma)
export const runtime = "nodejs";

// Routes that don't require authentication
const publicRoutes = ["/login", "/signout"];

// Routes accessible to authenticated but pending users
const pendingRoutes = ["/waitlist"];

// API routes that don't require authentication
const publicApiRoutes = ["/api/auth"];

// API routes accessible to authenticated but pending users
const pendingApiRoutes = ["/api/me"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check session for protected routes
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      // Redirect to login for non-API routes
      if (!pathname.startsWith("/api/")) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Return 401 for API routes
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user approval status from database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { status: true },
    });

    const isApproved = user?.status === "approved";
    const isPendingRoute = pendingRoutes.some((route) => pathname.startsWith(route));

    // If user is approved and trying to access /waitlist, redirect to home
    if (isApproved && isPendingRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If user is NOT approved
    if (!isApproved) {
      // Allow access to pending routes (like /waitlist)
      if (isPendingRoute) {
        return NextResponse.next();
      }

      // Allow access to pending API routes (like /api/me)
      const isPendingApiRoute = pendingApiRoutes.some((route) => pathname.startsWith(route));
      if (isPendingApiRoute) {
        return NextResponse.next();
      }

      // Redirect to waitlist for non-API routes
      if (!pathname.startsWith("/api/")) {
        return NextResponse.redirect(new URL("/waitlist", request.url));
      }

      // Return 403 for API routes (authenticated but not approved)
      return NextResponse.json(
        { success: false, error: { code: "NOT_APPROVED", message: "Account pending approval" } },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    // On error, redirect to login for safety
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};

