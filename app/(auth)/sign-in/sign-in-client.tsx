"use client";

import { signInAction } from "@/lib/actions/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

const formSchema = z.object({
  email: z.string().email({
    message: "Por favor ingresa un email válido.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
});

function SignInContent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // Handle invitation links with access_token in URL hash
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=")) {
        try {
          setIsRedirecting(true);
          // Extract tokens manually from hash
          const hashParams = hash.substring(1); // Remove the # symbol
          const extractParam = (param: string) => {
            const match = new RegExp(`${param}=([^&]*)`).exec(hashParams);
            return match ? match[1] : null;
          };

          const accessToken = extractParam("access_token");
          const refreshToken = extractParam("refresh_token");
          const type = extractParam("type");

          if (accessToken) {
            console.log(
              "Found access token in URL hash, redirecting to set-password"
            );
            // Redirect to set-password page with all tokens
            let redirectUrl = `/set-password?token=${accessToken}`;
            if (refreshToken) {
              redirectUrl += `&refresh_token=${refreshToken}`;
            }

            // Use setTimeout to ensure the message is shown before redirecting
            setTimeout(() => {
              router.push(redirectUrl);
            }, 1000);
          }
        } catch (error) {
          console.error("Error processing URL hash:", error);
          setIsRedirecting(false);
        }
      }
    }
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      const result = await signInAction(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Ingresa tus credenciales para acceder
        </p>
      </div>

      {isRedirecting && (
        <div className="bg-blue-100 text-blue-800 text-sm p-3 rounded-md mb-6">
          Detectando invitación... Redireccionando a la página de configuración
          de contraseña.
        </div>
      )}

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {!isRedirecting && (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="tu@ejemplo.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Contraseña</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                        tabIndex={isLoading ? -1 : undefined}
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Autenticando..." : "Iniciar sesión"}
              </Button>
            </form>
          </Form>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/sign-up"
                className="text-primary hover:underline"
                tabIndex={isLoading ? -1 : undefined}
              >
                Regístrate
              </Link>
            </p>
          </div>
        </>
      )}
    </>
  );
}

export default function SignInClient() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SignInContent />
    </Suspense>
  );
}
