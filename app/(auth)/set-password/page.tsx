import { Suspense } from "react";
import SetPasswordClient from "./set-password-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Establecer contraseña",
  description: "Crea una contraseña para tu cuenta",
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string; refresh_token: string }>;
}) {
  const { token, refresh_token } = await searchParams;

  // Token from URL parameters for server-side rendering
  return !token ? (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold">Error</h1>
      <p className="text-sm text-muted-foreground mt-2">
        No se ha proporcionado un token válido en los parámetros
      </p>
      <div className="mt-4">
        <a href="/sign-in" className="text-primary hover:underline">
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  ) : (
    <Suspense fallback={<div>Cargando...</div>}>
      <SetPasswordClient token={token} refreshToken={refresh_token} />
    </Suspense>
  );
}
