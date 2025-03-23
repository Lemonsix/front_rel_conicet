"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEmbarcacionAction(formData: {
  nombre: string;
  matricula: string;
}) {
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

export async function getEmbarcacionesAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("embarcaciones")
    .select(
      `
      id,
      nombre,
      matricula
    `
    )
    .order("id", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}
