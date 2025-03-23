"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Segmento } from "../types/segmento";

export async function createSegmentoAction(formData: {
  transecta_id: number;
  numero: number;
  coordenadas_inicio: string;
  coordenadas_fin: string;
  profundidad_final: number;
  profundidad_inicial?: number;
  sustrato_id: number;
  conteo: number;
  largo: number;
  est_minima: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("segmentos")
    .insert([
      {
        ...formData,
        est_minima: 0, // Por ahora lo dejamos en 0
      },
    ])
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
    .select(
      `
      id,
      codigo,
      descripcion
    `
    )
    .order("codigo");

  if (error) {
    return { error: error.message };
  }

  return { data };
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

  // Mapear los datos al formato correcto
  const segmento: Segmento = {
    id: data.id,
    transectId: data.transecta_id,
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

// Función para calcular la distancia entre dos puntos en metros usando la fórmula de Haversine
export async function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}
