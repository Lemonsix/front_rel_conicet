"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCampaniaAction(formData: {
  nombre: string;
  responsable_id: string;
  observaciones?: string;
  inicio: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campanias")
    .insert([formData])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/campanias");
  return { data };
}

export async function getCampaniasAction() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("campanias").select(`
      *,
      responsable:personas(id, nombre, apellido, rol),
      cantidadTransectas:transectas(count)
    `);

  if (error) {
    return { error: error.message };
  }

  return { data };
}
