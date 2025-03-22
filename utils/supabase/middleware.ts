import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
