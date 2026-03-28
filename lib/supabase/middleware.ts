import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/database.types";
import {
  getSupabasePublishableKey,
  getSupabaseUrl
} from "@/lib/supabase/env";

const protectedRoutes = [
  "/",
  "/dashboard",
  "/calendar",
  "/apartments",
  "/bookings",
  "/expenses",
  "/reports",
  "/settings"
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });
  type ResponseCookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof response.cookies.set>[2];
  };

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: ResponseCookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: ResponseCookieToSet) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({ name, value, options }: ResponseCookieToSet) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  const isAuthenticated = !claimsError && Boolean(claims?.sub);
  const isProtectedRoute = matchesRoute(request.nextUrl.pathname, protectedRoutes);
  const isLoginRoute = request.nextUrl.pathname === "/login";

  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
