"use client";

import { useSearchParams } from "next/navigation";
import { SetPasswordForm } from "./set-password-form";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="text-center text-red-500">
            No se encontró un token de invitación válido. Por favor, usa el
            enlace del email de invitación.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <SetPasswordForm token={token} />
      </div>
    </div>
  );
}
