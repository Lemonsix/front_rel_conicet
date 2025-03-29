"use client";

import { SetPasswordForm } from "@/components/auth/set-password-form";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SetPasswordContent({
  token,
  refreshToken,
}: {
  token: string;
  refreshToken: string;
}) {
  const searchParams = useSearchParams();
  const [clientToken, setClientToken] = useState(token);
  const [clientRefreshToken, setClientRefreshToken] = useState(refreshToken);

  // Check URL hash for tokens on client side
  useEffect(() => {
    // If we already have server-side tokens, use those
    if (clientToken) return;

    // Try to get token from search params first (might have been redirected)
    const urlToken = searchParams.get("token");
    const urlRefreshToken = searchParams.get("refresh_token");

    if (urlToken) {
      setClientToken(urlToken);
      if (urlRefreshToken) setClientRefreshToken(urlRefreshToken);
      return;
    }

    // Otherwise check for hash tokens (direct from invitation link)
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=")) {
        const extractParam = (param: string) => {
          const match = new RegExp(`${param}=([^&]*)`).exec(hash.substring(1));
          return match ? match[1] : null;
        };

        const hashToken = extractParam("access_token");
        const hashRefreshToken = extractParam("refresh_token");

        if (hashToken) {
          // Cleanup URL for better UX (removes the hash)
          window.history.replaceState(
            {},
            document.title,
            `${window.location.pathname}?token=${hashToken}${
              hashRefreshToken ? `&refresh_token=${hashRefreshToken}` : ""
            }`
          );

          setClientToken(hashToken);
          if (hashRefreshToken) setClientRefreshToken(hashRefreshToken);
        }
      }
    }
  }, [searchParams, clientToken]);

  if (!clientToken) {
    return (
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Establecer contraseña</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Crea una nueva contraseña para tu cuenta
        </p>
      </div>

      <SetPasswordForm token={clientToken} refreshToken={clientRefreshToken} />
    </>
  );
}

export default function SetPasswordClient({
  token,
  refreshToken,
}: {
  token: string;
  refreshToken: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Cargando...</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Preparando la pantalla de configuración de contraseña
          </p>
        </div>
      }
    >
      <SetPasswordContent token={token} refreshToken={refreshToken} />
    </Suspense>
  );
}
