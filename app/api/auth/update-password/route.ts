import { createClient } from "@/lib/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password, token, refresh_token } = await request.json();

    if (!password || !token) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Establecemos la sesión con el token de acceso y refresh token
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refresh_token || "",
    });

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 400 }
      );
    }

    // Actualizamos la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
