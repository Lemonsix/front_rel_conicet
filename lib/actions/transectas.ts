"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables, TablesInsert } from "@/lib/types/database.types";

export async function getTransectasByCampaniaAction(
  campaniaId: number
): Promise<{
  data?: any[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Primero obtenemos las transectas básicas
    const { data: transectas, error: transectasError } = await supabase
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
        campania_id
      `
      )
      .eq("campania_id", campaniaId);

    if (transectasError) {
      return { error: transectasError.message };
    }

    if (!transectas || transectas.length === 0) {
      return { data: [] };
    }

    // Obtener las embarcaciones
    const embarcacionesIds = [
      ...new Set(transectas.map((t) => t.embarcacion_id).filter(Boolean)),
    ];
    const { data: embarcaciones, error: embarcacionesError } = await supabase
      .from("embarcaciones")
      .select("id, nombre, matricula")
      .in("id", embarcacionesIds);

    if (embarcacionesError) {
      return { error: embarcacionesError.message };
    }

    // Obtener los buzos
    const buzosIds = [
      ...new Set(transectas.map((t) => t.buzo_id).filter(Boolean)),
    ];
    const { data: buzos, error: buzosError } = await supabase
      .from("personas")
      .select("id, nombre, apellido, rol")
      .in("id", buzosIds);

    if (buzosError) {
      return { error: buzosError.message };
    }

    // Crear mapas para acceso rápido
    const embarcacionesMap = new Map(
      embarcaciones?.map((e) => [e.id, e]) || []
    );
    const buzosMap = new Map(buzos?.map((b) => [b.id, b]) || []);

    // Mapear las transectas con sus relaciones
    const transectasConRelaciones = transectas.map((transecta) => ({
      ...transecta,
      embarcacion: transecta.embarcacion_id
        ? embarcacionesMap.get(transecta.embarcacion_id)
        : null,
      buzo: transecta.buzo_id ? buzosMap.get(transecta.buzo_id) : null,
    }));

    revalidatePath(`/campanias/${campaniaId}`);
    return { data: transectasConRelaciones };
  } catch (error) {
    console.error("Error inesperado:", error);
    return { error: String(error) };
  }
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
