"use server";

import { createClient } from "@/lib/utils/supabase/server";
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

export async function updateEmbarcacionAction(
  id: number,
  formData: {
    nombre: string;
    matricula: string;
  }
) {
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
