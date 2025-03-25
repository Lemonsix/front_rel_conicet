"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database.types";

export async function createCampaniaAction(
  formData: TablesInsert<"campanias">
): Promise<{
  data?: Tables<"campanias">;
  error?: string;
}> {
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

export async function getCampaniasAction(): Promise<{
  data?: any[]; // Usamos any porque el resultado tiene formato diferente por los joins
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campanias")
    .select(
      `
      id,
      nombre,
      inicio,
      fin,
      observaciones,
      responsable:personas(id, nombre, apellido, rol),
      cantidadTransectas:transectas(count)
    `
    )
    .order("id", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getCampaniaByIdAction(campaniaId: number): Promise<{
  data?: any; // Usamos any porque el resultado tiene un formato complejo con muchos joins
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campanias")
    .select(
      `
      id,
      nombre,
      observaciones,
      inicio,
      fin,
      cantidadTransectas: transectas(count),
      responsable:personas!campanias_fk_responsable_personas(
        id,
        nombre,
        apellido,
        rol
      ),
      transectas(
        id,
        nombre,
        observaciones,
        fecha,
        hora_inicio,
        hora_fin,
        profundidad_inicial,
        orientacion,
        embarcacion_id,
        buzo_id,
        campania_id,
        embarcacion:embarcaciones!transectas_fk_embarcaciones(
          id,
          nombre,
          matricula
        ),
        buzo:personas!transectas_fk_buzo_personas(
          id,
          nombre,
          apellido,
          rol
        )
      )
    `
    )
    .eq("id", campaniaId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: { campania: data, transectas: data.transectas } };
}
