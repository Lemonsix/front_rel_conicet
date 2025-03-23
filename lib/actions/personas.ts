"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPersonaAction(formData: {
  nombre: string;
  apellido: string;
  rol: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personas")
    .insert([formData])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/personas");
  return { data };
}

export async function getPersonasAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personas")
    .select(
      `
      id,
      nombre,
      apellido,
      rol
    `
    )
    .order("id", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getPersonasByRolAction(rol: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre, apellido")
    .eq("rol", rol);

  if (error) {
    return { error: error.message };
  }

  return { data };
}
