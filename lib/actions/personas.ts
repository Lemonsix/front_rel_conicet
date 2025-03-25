"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database.types";

export async function createPersonaAction(formData: TablesInsert<"personas">) {
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

export async function getPersonasAction(): Promise<{
  data?: Tables<"personas">[];
  error?: string;
}> {
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

export async function getPersonasByRolAction(rol: string): Promise<{
  data?: Tables<"personas">[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre, apellido, rol")
    .eq("rol", rol);

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function updatePersonaAction(
  id: number,
  formData: TablesUpdate<"personas">
): Promise<{
  data?: Tables<"personas">;
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personas")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/personas");
  return { data };
}
