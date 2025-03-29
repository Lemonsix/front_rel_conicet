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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/utils/supabase/client";

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

interface SetPasswordFormProps {
  token: string;
  refreshToken?: string;
}

export function SetPasswordForm({ token, refreshToken }: SetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check for hash in URL on client-side
  useEffect(() => {
    if (typeof window !== "undefined" && !token && window.location.hash) {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=")) {
        const accessToken = hash.split("access_token=")[1]?.split("&")[0];
        if (accessToken) {
          // Clean up the URL - remove the hash and redirect with token as query param
          window.location.href =
            window.location.pathname + "?token=" + accessToken;
        }
      }
    }
  }, [token]);

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
      // Create Supabase client
      const supabase = createClient();

      // Set session using token
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken || "",
      });

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Success
      setSuccess("Contraseña actualizada correctamente");
      form.reset();

      // Redirect after a delay
      setTimeout(() => {
        router.push("/campanias");
      }, 2000);
    } catch (err) {
      console.error("Error en la actualización de contraseña:", err);
      setError("Ocurrió un error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
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
