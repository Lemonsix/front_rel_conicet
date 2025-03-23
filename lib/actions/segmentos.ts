"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSegmentoAction(formData: {
  transect_id: number;
  coordenadas_fin: string;
  profundidad_final: number;
  sustrato_id: number;
  conteo: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("segmentos")
    .insert([formData])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/campanias");
  return { data };
}

export async function getSustratosAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sustratos")
    .select("*")
    .order("codigo");

  if (error) {
    return { error: error.message };
  }

  return { data };
}
