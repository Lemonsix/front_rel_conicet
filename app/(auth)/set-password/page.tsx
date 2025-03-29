"use client";

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
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const formSchema = z
  .object({
    password: z.string().min(6, {
      message: "La contraseña debe tener al menos 6 caracteres.",
    }),
    confirm: z.string().min(6, {
      message: "La contraseña debe tener al menos 6 caracteres.",
    }),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

export default function SetPassword() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const refresh_token = searchParams.get("refresh_token");

  if (!token) {
    return (
      <>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-sm text-muted-foreground mt-2">
            No se ha proporcionado un token válido
          </p>
        </div>
        <div className="text-center mt-6">
          <Link href="/sign-in" className="text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </>
    );
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: values.password,
          token,
          refresh_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ocurrió un error al actualizar la contraseña");
      } else {
        setSuccess("Contraseña actualizada correctamente");
        form.reset();
        // Redirigir al inicio después de un tiempo
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      setError("Ocurrió un error al actualizar la contraseña");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Establecer contraseña</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Crea una nueva contraseña para tu cuenta
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md mb-6">
          {success}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? "Procesando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </Form>
    </>
  );
}
