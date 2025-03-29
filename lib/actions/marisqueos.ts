"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables } from "@/lib/types/database.types";

// Definir la estructura de un Marisqueo
export interface Marisqueo {
  id: number;
  segmento_id: number;
  transecta_id: number;
  buzo_id: number;
  nombre_transecta: string;
  nombre_buzo?: string;
  numero_segmento: number;
  fecha: string;
  n_captura: number;
  profundidad?: number | null;
  tiempo?: number | null;
  peso_muestra?: number | null;
  tiene_muestreo?: boolean | null;
  observaciones?: string;
}

/**
 * Obtiene todos los marisqueos asociados a una campaña
 */
export async function getMarisqueosByCampaniaAction(
  campaniaId: number
): Promise<{
  data?: Marisqueo[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Primero obtenemos las transectas de la campaña
    const { data: transectas, error: transectasError } = await supabase
      .from("transectas")
      .select("id, nombre, fecha")
      .eq("campania_id", campaniaId);

    if (transectasError) {
      console.error("Error al obtener transectas:", transectasError);
      return { error: transectasError.message };
    }

    if (!transectas || transectas.length === 0) {
      return { data: [] };
    }

    // Obtenemos los IDs de transectas
    const transectasIds = transectas.map((t) => t.id);

    // Obtenemos los segmentos asociados a esas transectas
    const { data: segmentos, error: segmentosError } = await supabase
      .from("segmentos")
      .select("id, transecta_id, numero, tiene_marisqueo")
      .in("transecta_id", transectasIds)
      .eq("tiene_marisqueo", "SI"); // Los valores en la BD son "SI" o "NO" como strings

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);
      return { error: segmentosError.message };
    }

    if (!segmentos || segmentos.length === 0) {
      return { data: [] };
    }

    // Obtenemos los IDs de segmentos que tienen marisqueos
    const segmentosIds = segmentos.map((s) => s.id);

    // Consultamos la tabla de marisqueos
    const { data: marisqueosData, error: marisqueosError } = await supabase
      .from("marisqueos")
      .select("*, buzo:buzo_id(id, nombre, apellido)")
      .in("segmento_id", segmentosIds);

    if (marisqueosError) {
      console.error("Error al obtener marisqueos:", marisqueosError);
      return { error: marisqueosError.message };
    }

    // Creamos mapas para búsquedas rápidas
    const transectasMap = new Map(transectas.map((t) => [t.id, t]));
    const segmentosMap = new Map(segmentos.map((s) => [s.id, s]));

    // Transformamos los datos a nuestro formato de respuesta
    const marisqueosMapeados =
      marisqueosData?.map((marisqueo: any) => {
        const segmento = segmentosMap.get(marisqueo.segmento_id);
        const transectaId = segmento?.transecta_id || 0;
        const transecta = transectasMap.get(transectaId);
        const buzoInfo = marisqueo.buzo;

        return {
          id: marisqueo.id,
          segmento_id: marisqueo.segmento_id,
          transecta_id: transectaId,
          buzo_id: marisqueo.buzo_id,
          nombre_transecta: transecta?.nombre || `Transecta ${transectaId}`,
          nombre_buzo: buzoInfo
            ? `${buzoInfo.nombre} ${buzoInfo.apellido}`
            : undefined,
          numero_segmento: segmento?.numero || 0,
          fecha: transecta?.fecha || new Date().toISOString().split("T")[0],
          n_captura: marisqueo.n_captura,
          profundidad: marisqueo.profundidad,
          tiempo: marisqueo.tiempo,
          peso_muestra: marisqueo.peso_muestra,
          tiene_muestreo: marisqueo.tiene_muestreo,
          observaciones: `Marisqueo ${marisqueo.n_captura} en segmento ${
            segmento?.numero || 0
          }`,
        };
      }) || [];

    return { data: marisqueosMapeados };
  } catch (error) {
    console.error("Error al obtener marisqueos:", error);
    return { error: String(error) };
  }
}

/**
 * Obtiene todos los marisqueos asociados a una transecta específica
 */
export async function getMarisqueosByTransectaAction(
  transectaId: number
): Promise<{
  data?: Marisqueo[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Obtenemos la información de la transecta
    const { data: transecta, error: transectaError } = await supabase
      .from("transectas")
      .select("id, nombre, fecha")
      .eq("id", transectaId)
      .single();

    if (transectaError) {
      console.error("Error al obtener transecta:", transectaError);
      return { error: transectaError.message };
    }

    if (!transecta) {
      return { data: [] };
    }

    // Obtenemos los segmentos de la transecta
    const { data: segmentos, error: segmentosError } = await supabase
      .from("segmentos")
      .select("id, transecta_id, numero, tiene_marisqueo")
      .eq("transecta_id", transectaId)
      .eq("tiene_marisqueo", "SI"); // Los valores en la BD son "SI" o "NO" como strings

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);
      return { error: segmentosError.message };
    }

    if (!segmentos || segmentos.length === 0) {
      return { data: [] };
    }

    // Obtenemos los IDs de segmentos que tienen marisqueos
    const segmentosIds = segmentos.map((s) => s.id);

    // Consultamos la tabla de marisqueos
    const { data: marisqueosData, error: marisqueosError } = await supabase
      .from("marisqueos")
      .select("*, buzo:buzo_id(id, nombre, apellido)")
      .in("segmento_id", segmentosIds);

    if (marisqueosError) {
      console.error("Error al obtener marisqueos:", marisqueosError);
      return { error: marisqueosError.message };
    }

    // Creamos un mapa para buscar segmentos rápidamente
    const segmentosMap = new Map(segmentos.map((s) => [s.id, s]));

    // Transformamos los datos a nuestro formato de respuesta
    const marisqueosMapeados =
      marisqueosData?.map((marisqueo: any) => {
        const segmento = segmentosMap.get(marisqueo.segmento_id);
        const buzoInfo = marisqueo.buzo;

        return {
          id: marisqueo.id,
          segmento_id: marisqueo.segmento_id,
          transecta_id: transectaId,
          buzo_id: marisqueo.buzo_id,
          nombre_transecta: transecta.nombre || `Transecta ${transectaId}`,
          nombre_buzo: buzoInfo
            ? `${buzoInfo.nombre} ${buzoInfo.apellido}`
            : undefined,
          numero_segmento: segmento?.numero || 0,
          fecha: transecta.fecha,
          n_captura: marisqueo.n_captura,
          profundidad: marisqueo.profundidad,
          tiempo: marisqueo.tiempo,
          peso_muestra: marisqueo.peso_muestra,
          tiene_muestreo: marisqueo.tiene_muestreo,
          observaciones: `Marisqueo ${marisqueo.n_captura} en segmento ${
            segmento?.numero || 0
          }`,
        };
      }) || [];

    return { data: marisqueosMapeados };
  } catch (error) {
    console.error("Error al obtener marisqueos:", error);
    return { error: String(error) };
  }
}
