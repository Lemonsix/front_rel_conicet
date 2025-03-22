import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const access_token = requestUrl.hash
    ?.split("access_token=")[1]
    ?.split("&")[0];

  if (access_token) {
    // Redirigimos a la página de configuración de contraseña con el token
    return NextResponse.redirect(
      new URL(`/auth/set-password?token=${access_token}`, request.url)
    );
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = await createClient();

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/campanias", request.url));
}
