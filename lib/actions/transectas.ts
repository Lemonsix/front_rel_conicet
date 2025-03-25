"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables, TablesInsert } from "@/lib/types/database.types";

export async function getTransectasByCampaniaAction(
  campaniaId: number
): Promise<{
  data?: any[]; // Usamos any porque el resultado tiene formato complejo por los joins anidados
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transectas")
    .select(
      `
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
      ),
      segmentos(
        id,
        numero,
        largo,
        profundidad_inicial,
        profundidad_final,
        sustrato:sustratos!segmentos_fk_sustratos(id)(
          id,
          codigo,
          descripcion
        ),
        conteo,
        est_minima,
        coordenadas_inicio,
        coordenadas_fin,
        tiene_marisqueo,
        tiene_cuadrados,
        marisqueos!marisqueos_fk_segmentos(
          id,
          segmento_id,
          timestamp,
          tiempo,
          coordenadas,
          tiene_muestreo,
          buzo_id,
          n_captura,
          peso_muestra
        ),
        cuadrados(
          id,
          segmento_id,
          replica,
          coordenadas_inicio,
          coordenadas_fin,
          profundidad_inicio,
          profundidad_fin,
          tiene_muestreo,
          conteo,
          tamanio,
          timestamp
        )
      )
    `
    )
    .eq("campania_id", campaniaId);

  if (error) {
    return { error: error.message };
  }
  revalidatePath(`/campanias/${campaniaId}`);
  return { data };
}

export async function createTransectaAction(
  formData: TablesInsert<"transectas">
): Promise<{
  data?: Tables<"transectas">;
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transectas")
    .insert([formData])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/campanias/${formData.campania_id}`);
  return { data };
}

export async function getNombresTransectasAction(): Promise<{
  data?: string[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transectas_templates")
    .select("nombre")
    .order("nombre");

  if (error) {
    return { error: error.message };
  }

  // Obtener nombres únicos
  const nombresUnicos = [...new Set(data.map((t) => t.nombre))];

  return { data: nombresUnicos };
}
