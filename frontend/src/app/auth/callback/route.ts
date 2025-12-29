import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Default to "/" if no next param, or if it's external
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") ? nextParam : "/";

  // Helper to redirect to error page
  const redirectToError = (msg: string) => {
    return NextResponse.redirect(`${origin}/auth/auth-error?error=${encodeURIComponent(msg)}`);
  };

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables in auth callback");
      return redirectToError("Configuration error");
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Note: This needs to be response.cookies.set in the implementation, 
              // but we are returning the response at the end. Use a mutable response object?
              // The cookie handling in createServerClient with next/server middleware/route handlers
              // usually requires creating the response first or managing cookies on the request/response.
              // For Route Handlers, we can use CookieStore? No, createServerClient documentation for SSR
              // says to use proper cookie handling. 
              // But here we can't easily modify the *response* object before creating it.
              // Actually, simply setting response.cookies later is sufficient if we capture them.
              // BUT for the *exchange*, Supabase needs to SET cookies. 
              // The `setAll` callback is where we receive the cookies Supabase WANTS to set.
              // We should store them and apply them to the response we return.
            });
          },
        },
      }
    );

    /* 
       FIX: The standard createServerClient for App Router Route Handlers expects us to permit cookie setting.
       The pattern in the previous code was:
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({ name, value, ...options });
            });
          }
       BUT `response` was defined earlier as `NextResponse.redirect(...)`. 
       This works because `NextResponse` object is mutable regarding cookies before returning.
    */

    // We recreate the response object if meaningful logic happens, but here we can keep the pattern
    // IF we are careful.

    const response = NextResponse.redirect(`${origin}${next}`);

    const supabaseWithCookies = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    const { error } = await supabaseWithCookies.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback exchange failed", error);
      return redirectToError(error.message || "Authentication failed");
    }

    return response;
  }

  // No code? Just redirect, but this route shouldn't be hit without code usually.
  return NextResponse.redirect(`${origin}${next}`);
}
