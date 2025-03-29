import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

//Crear cliente de supabase en servidor usando Nextjs15 con cookies async
export const createClient = async () => {
  const cookieStore = await cookies(); // Ahora es async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método `setAll` fue llamado desde un Server Component.
            // Esto puede ignorarse si tienes middleware que refresca las sesiones de usuario.
          }
        },
      },
    }
  );
};
