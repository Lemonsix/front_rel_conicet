"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables } from "@/lib/types/database.types";

// Definir la estructura de un Cuadrado
export interface Cuadrado {
  id: number;
  segmento_id: number;
  transecta_id: number;
  nombre_transecta: string;
  numero_segmento: number;
  fecha: string;
  replica: number;
  tamanio: number;
  profundidad_inicio?: number | null;
  profundidad_fin?: number | null;
  conteo?: number | null;
  tiene_muestreo?: string | null;
  observaciones?: string;
}

/**
 * Obtiene todos los cuadrados asociados a una campaña
 */
export async function getCuadradosByCampaniaAction(
  campaniaId: number
): Promise<{
  data?: Cuadrado[];
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

    // Obtenemos todos los segmentos asociados a esas transectas sin filtrar por el flag
    const { data: segmentos, error: segmentosError } = await supabase
      .from("segmentos")
      .select("id, transecta_id, numero")
      .in("transecta_id", transectasIds);

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);
      return { error: segmentosError.message };
    }

    if (!segmentos || segmentos.length === 0) {
      return { data: [] };
    }

    // Obtenemos los IDs de todos los segmentos
    const segmentosIds = segmentos.map((s) => s.id);

    // Consultamos la tabla de cuadrados para los segmentos
    const { data: cuadradosData, error: cuadradosError } = await supabase
      .from("cuadrados")
      .select("*")
      .in("segmento_id", segmentosIds);

    if (cuadradosError) {
      console.error("Error al obtener cuadrados:", cuadradosError);
      return { error: cuadradosError.message };
    }

    // Si no hay cuadrados, retornamos array vacío
    if (!cuadradosData || cuadradosData.length === 0) {
      return { data: [] };
    }

    // Creamos mapas para buscar datos rápidamente
    const transectasMap = new Map(transectas.map((t) => [t.id, t]));
    const segmentosMap = new Map(segmentos.map((s) => [s.id, s]));

    // Transformamos los datos a nuestro formato de respuesta
    const cuadradosMapeados = cuadradosData.map(
      (cuadrado: Tables<"cuadrados">) => {
        const segmento = segmentosMap.get(cuadrado.segmento_id);
        const transectaId = segmento?.transecta_id || 0;
        const transecta = transectasMap.get(transectaId);

        return {
          id: cuadrado.id,
          segmento_id: cuadrado.segmento_id,
          transecta_id: transectaId,
          nombre_transecta: transecta?.nombre || `Transecta ${transectaId}`,
          numero_segmento: segmento?.numero || 0,
          fecha: transecta?.fecha || new Date().toISOString().split("T")[0],
          replica: cuadrado.replica,
          tamanio: cuadrado.tamanio,
          profundidad_inicio: cuadrado.profundidad_inicio,
          profundidad_fin: cuadrado.profundidad_fin,
          conteo: cuadrado.conteo,
          tiene_muestreo: cuadrado.tiene_muestreo,
          observaciones: `Cuadrado ${cuadrado.replica} en segmento ${
            segmento?.numero || 0
          }`,
        };
      }
    );

    return { data: cuadradosMapeados };
  } catch (error) {
    console.error("Error al obtener cuadrados:", error);
    return { error: String(error) };
  }
}

/**
 * Obtiene todos los cuadrados asociados a una transecta específica
 */
export async function getCuadradosByTransectaAction(
  transectaId: number
): Promise<{
  data?: Cuadrado[];
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

    // Obtenemos todos los segmentos de la transecta sin filtrar por flag
    const { data: segmentos, error: segmentosError } = await supabase
      .from("segmentos")
      .select("id, transecta_id, numero")
      .eq("transecta_id", transectaId);

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);
      return { error: segmentosError.message };
    }

    if (!segmentos || segmentos.length === 0) {
      return { data: [] };
    }

    // Obtenemos los IDs de todos los segmentos
    const segmentosIds = segmentos.map((s) => s.id);

    // Consultamos la tabla de cuadrados
    const { data: cuadradosData, error: cuadradosError } = await supabase
      .from("cuadrados")
      .select("*")
      .in("segmento_id", segmentosIds);

    if (cuadradosError) {
      console.error("Error al obtener cuadrados:", cuadradosError);
      return { error: cuadradosError.message };
    }

    // Si no hay cuadrados, retornamos array vacío
    if (!cuadradosData || cuadradosData.length === 0) {
      return { data: [] };
    }

    // Creamos un mapa para buscar segmentos rápidamente
    const segmentosMap = new Map(segmentos.map((s) => [s.id, s]));

    // Transformamos los datos a nuestro formato de respuesta
    const cuadradosMapeados = cuadradosData.map(
      (cuadrado: Tables<"cuadrados">) => {
        const segmento = segmentosMap.get(cuadrado.segmento_id);

        return {
          id: cuadrado.id,
          segmento_id: cuadrado.segmento_id,
          transecta_id: transectaId,
          nombre_transecta: transecta.nombre || `Transecta ${transectaId}`,
          numero_segmento: segmento?.numero || 0,
          fecha: transecta.fecha,
          replica: cuadrado.replica,
          tamanio: cuadrado.tamanio,
          profundidad_inicio: cuadrado.profundidad_inicio,
          profundidad_fin: cuadrado.profundidad_fin,
          conteo: cuadrado.conteo,
          tiene_muestreo: cuadrado.tiene_muestreo,
          observaciones: `Cuadrado ${cuadrado.replica} en segmento ${
            segmento?.numero || 0
          }`,
        };
      }
    );

    return { data: cuadradosMapeados };
  } catch (error) {
    console.error("Error al obtener cuadrados:", error);
    return { error: String(error) };
  }
}

/**
 * Crea un nuevo cuadrado en un segmento
 */
export async function createCuadradoAction(formData: {
  segmento_id: number;
  replica: number;
  tamanio: number;
  coordenadas_inicio: string;
  coordenadas_fin: string;
  profundidad_inicio?: number;
  profundidad_fin?: number;
  conteo?: number;
  tiene_muestreo?: string;
}): Promise<{ data?: Tables<"cuadrados">; error?: string }> {
  const supabase = await createClient();

  try {
    const cuadradoData = {
      ...formData,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("cuadrados")
      .insert([cuadradoData])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return { data };
  } catch (error) {
    console.error("Error al crear cuadrado:", error);
    return { error: String(error) };
  }
}

/**
 * Obtiene el último cuadrado creado en un segmento específico
 */
export async function getUltimoCuadradoAction(
  segmentoId: number
): Promise<{ data?: any; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("cuadrados")
      .select("*")
      .eq("segmento_id", segmentoId)
      .order("replica", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 es el código cuando no se encuentra ningún registro
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error("Error al obtener el último cuadrado:", error);
    return { error: String(error) };
  }
}

/**
 * Verifica si ya existe un cuadrado con la réplica especificada en el segmento
 */
export async function checkCuadradoReplicaAvailabilityAction(
  segmentoId: number,
  replica: number
): Promise<{ available?: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error, count } = await supabase
      .from("cuadrados")
      .select("*", { count: "exact", head: true })
      .eq("segmento_id", segmentoId)
      .eq("replica", replica);

    if (error) {
      return { error: error.message };
    }

    return { available: count === 0 };
  } catch (error) {
    console.error("Error al verificar disponibilidad de réplica:", error);
    return { error: String(error) };
  }
}
