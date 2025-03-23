import { Embarcacion } from "@/lib/types/embarcacion";
import { createClient } from "@/utils/supabase/server";

export async function createEmbarcacion(embarcacion: Omit<Embarcacion, "id">) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("embarcaciones")
    .insert([embarcacion])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEmbarcaciones() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("embarcaciones").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
