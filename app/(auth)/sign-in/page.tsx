"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./login-form";
import { Suspense } from "react";

function SignInContent() {
  const router = useRouter();

  useEffect(() => {
    // Extraer todos los parámetros del hash si existe
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      // Convertimos el hash en un objeto de parámetros
      const params = Object.fromEntries(
        hash
          .substring(1) // Removemos el #
          .split("&")
          .map((param) => param.split("="))
      );

      // Verificamos que sea un token de invitación
      if (params.type === "invite" && params.access_token) {
        // Redirigimos preservando todos los parámetros importantes
        const searchParams = new URLSearchParams({
          token: params.access_token,
          refresh_token: params.refresh_token || "",
          type: params.type,
        });
        router.push(`/auth/set-password?${searchParams.toString()}`);
      }
    }
  }, [router]);

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <LoginForm />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="text-center">Cargando...</div>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
