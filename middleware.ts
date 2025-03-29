import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth routes (sign-in, sign-up, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|auth|sign-in|set-password).*)",
    // Add sign-in path to check for token
    "/sign-in",
  ],
};

export async function middleware(request: NextRequest) {
  try {
    // Check if user is coming to sign-in with a token
    // This would indicate they should go directly to set-password
    if (request.nextUrl.pathname === "/sign-in") {
      const token = request.nextUrl.searchParams.get("token");

      // If there's a token in the URL, redirect to set-password
      if (token) {
        const url = request.nextUrl.clone();
        url.pathname = "/set-password";
        // Keep all the search params
        return NextResponse.redirect(url);
      }

      // Note: We can't check for hash in server-side middleware
      // This is handled on the client side in set-password-form.tsx

      // Continue normal flow for sign-in page if no token
      return NextResponse.next();
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    // Verificar la sesión
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Crear la respuesta después de verificar la sesión
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Si el usuario está autenticado y está en la ruta raíz, redirigir a /campanias
    if (user && request.nextUrl.pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/campanias";
      return NextResponse.redirect(url);
    }

    // Si el usuario no está autenticado y no está en una ruta de auth, redirigir a /sign-in
    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/sign-in") &&
      !request.nextUrl.pathname.startsWith("/auth") &&
      !request.nextUrl.pathname.startsWith("/set-password")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }

    // Copiar las cookies a la respuesta
    const requestCookies = request.cookies.getAll();
    requestCookies.forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });

    return response;
  } catch (error) {
    console.error("Error in middleware:", error);
    return NextResponse.next({
      request,
    });
  }
}
