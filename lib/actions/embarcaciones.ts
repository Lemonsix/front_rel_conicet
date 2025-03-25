"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database.types";

export async function createEmbarcacionAction(
  formData: TablesInsert<"embarcaciones">
): Promise<{
  data?: Tables<"embarcaciones">;
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("embarcaciones")
    .insert([formData])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/embarcaciones");
  return { data };
}

export async function getEmbarcacionesAction(): Promise<{
  data?: Tables<"embarcaciones">[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("embarcaciones")
    .select(
      `
      id,
      nombre,
      matricula,
      descripcion
    `
    )
    .order("id", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function updateEmbarcacionAction(
  id: number,
  formData: TablesUpdate<"embarcaciones">
): Promise<{
  data?: Tables<"embarcaciones">;
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("embarcaciones")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/embarcaciones");
  return { data };
}
