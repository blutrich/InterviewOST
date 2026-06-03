import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/reset-password");
  const isPublicInterviewRoute =
    request.nextUrl.pathname.startsWith("/i/");
  const isPublicJoinRoute = request.nextUrl.pathname.startsWith("/join/");
  const isCallbackRoute = request.nextUrl.pathname.startsWith("/auth/callback");
  const isLandingPage = request.nextUrl.pathname === "/";
  const isPublicDocsRoute = request.nextUrl.pathname.startsWith("/docs");

  // Public API routes (token-based auth, not session-based)
  const isPublicApiRoute =
    request.nextUrl.pathname === "/api/chat" ||
    request.nextUrl.pathname === "/api/interviews/join" ||
    request.nextUrl.pathname === "/api/anam-session-token" ||
    request.nextUrl.pathname === "/api/interviews";

  // Allow public routes (removed isApiRoute - API routes now require auth)
  if (isPublicInterviewRoute || isPublicJoinRoute || isCallbackRoute || isPublicApiRoute || isLandingPage || isPublicDocsRoute) {
    return supabaseResponse;
  }

  // Handle unauthenticated API requests (return 401, not redirect)
  const isProtectedApiRoute = request.nextUrl.pathname.startsWith("/api") && !isPublicApiRoute;
  if (!user && isProtectedApiRoute) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Redirect unauthenticated users to login (except auth routes)
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (except reset-password)
  if (user && isAuthRoute && !request.nextUrl.pathname.startsWith("/reset-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
