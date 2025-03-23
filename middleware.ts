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
  ],
};

export async function middleware(request: NextRequest) {
  try {
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
      !request.nextUrl.pathname.startsWith("/auth")
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
