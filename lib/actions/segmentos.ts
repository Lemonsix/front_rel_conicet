"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Segmento } from "../types/segmento";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database.types";

export async function createSegmentoAction(
  formData: Omit<
    TablesInsert<"segmentos">,
    "tiene_marisqueo" | "tiene_cuadrados"
  >
): Promise<{ data?: Tables<"segmentos">; error?: string }> {
  const supabase = await createClient();

  const segmentoData: TablesInsert<"segmentos"> = {
    ...formData,
    est_minima: formData.est_minima ?? 0, // Si no se especifica, usamos 0
  };

  const { data, error } = await supabase
    .from("segmentos")
    .insert([segmentoData])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/campanias");
  return { data };
}

export async function getSustratosAction(): Promise<{
  data: Tables<"sustratos">[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sustratos")
    .select()
    .order("codigo");

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

export async function checkSegmentoNumberAvailabilityAction(
  transectaId: number,
  numero: number
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("segmentos")
    .select("id")
    .eq("transecta_id", transectaId)
    .eq("numero", numero)
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { available: !data };
}

export async function getUltimoSegmentoAction(
  transectaId: number
): Promise<{ data: Segmento | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("segmentos")
    .select(
      `
      id,
      transecta_id,
      numero,
      coordenadas_inicio,
      coordenadas_fin,
      profundidad_inicial,
      profundidad_final,
      sustrato_id,
      conteo,
      largo,
      est_minima
    `
    )
    .eq("transecta_id", transectaId)
    .order("numero", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: null };
  }

  // Mapear los datos de Tables<'segmentos'> a Segmento
  const segmento: Segmento = {
    id: data.id,
    transectaId: data.transecta_id,
    numero: data.numero,
    coordenadasInicio: data.coordenadas_inicio,
    coordenadasFin: data.coordenadas_fin,
    profundidadInicial: data.profundidad_inicial,
    profundidadFinal: data.profundidad_final,
    sustrato: {
      id: data.sustrato_id,
      codigo: "",
      descripcion: "",
    },
    estMinima: data.est_minima,
    conteo: data.conteo,
    largo: data.largo,
  };

  return { data: segmento, error: null };
}

export async function updateSegmentoAction(
  data: TablesUpdate<"segmentos"> & { id: number }
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("segmentos")
    .update({
      numero: data.numero,
      coordenadas_inicio: data.coordenadas_inicio,
      coordenadas_fin: data.coordenadas_fin,
      profundidad_inicial: data.profundidad_inicial,
      profundidad_final: data.profundidad_final,
      largo: data.largo,
      sustrato_id: data.sustrato_id,
      conteo: data.conteo,
      est_minima: data.est_minima,
    })
    .eq("id", data.id);

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function getSegmentosByTransectaAction(
  transectaId: number
): Promise<{ data: any[]; error: string | null }> {
  const supabase = await createClient();

  console.log("Obteniendo segmentos para transecta ID:", transectaId);

  try {
    const { data: segmentos, error: segmentosError } = await supabase
      .from("segmentos")
      .select(
        `
          id,
          transecta_id,
          numero,
          largo,
          profundidad_inicial,
          profundidad_final,
          sustrato_id,
          conteo,
          est_minima,
          tiene_marisqueo,
          tiene_cuadrados,
          coordenadas_inicio,
          coordenadas_fin
        `
      )
      .eq("transecta_id", transectaId)
      .order("numero");

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);
      return { data: [], error: segmentosError.message };
    }

    if (!segmentos || segmentos.length === 0) {
      console.log(
        "No se encontraron segmentos para la transecta:",
        transectaId
      );
      return { data: [], error: null };
    }

    console.log("Segmentos obtenidos:", segmentos.length);

    // Ahora cargar los sustratos para cada segmento
    const segmentosConSustrato = await Promise.all(
      segmentos.map(async (segmento) => {
        if (!segmento.sustrato_id) {
          return {
            ...segmento,
            sustrato: {
              id: 0,
              codigo: "",
              descripcion: "",
            },
            marisqueos: [],
            cuadrados: [],
          };
        }

        // Cargar sustrato
        const { data: sustrato } = await supabase
          .from("sustratos")
          .select("id, codigo, descripcion")
          .eq("id", segmento.sustrato_id)
          .single();

        return {
          ...segmento,
          sustrato: sustrato || {
            id: segmento.sustrato_id,
            codigo: "",
            descripcion: "",
          },
          // Por ahora dejamos estos arrays vacíos, se pueden cargar bajo demanda cuando se necesiten
          marisqueos: [],
          cuadrados: [],
        };
      })
    );

    return { data: segmentosConSustrato, error: null };
  } catch (error) {
    console.error("Error inesperado:", error);
    return { data: [], error: String(error) };
  }
}
