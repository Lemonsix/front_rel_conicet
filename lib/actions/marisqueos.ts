"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables } from "@/lib/types/database.types";
import { Marisqueo, TallaMarisqueo } from "@/lib/types/marisqueos";

// Re-exportar para compatibilidad con componentes que ya lo importan
export type { Marisqueo, TallaMarisqueo };

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

    // Consultamos la tabla de marisqueos
    const { data: marisqueosData, error: marisqueosError } = await supabase
      .from("marisqueos")
      .select("*, buzo:buzo_id(id, nombre, apellido)")
      .in("segmento_id", segmentosIds);

    if (marisqueosError) {
      console.error("Error al obtener marisqueos:", marisqueosError);
      return { error: marisqueosError.message };
    }

    // Si no hay marisqueos, retornamos array vacío
    if (!marisqueosData || marisqueosData.length === 0) {
      return { data: [] };
    }

    // Obtener todas las tallas de todos los marisqueos en una sola consulta
    const marisqueosIds = marisqueosData.map((m) => m.id);
    const { data: tallasData, error: tallasError } = await supabase
      .from("tallasmarisqueo2")
      .select("*")
      .in("marisqueo_id", marisqueosIds)
      .order("talla", { ascending: true });

    if (tallasError) {
      console.error("Error al obtener tallas:", tallasError);
      // No retornamos error por tallas, seguimos sin ellas
    }

    // Agrupar tallas por marisqueo_id
    const tallasMap = new Map<number, TallaMarisqueo[]>();
    if (tallasData) {
      tallasData.forEach((talla: any) => {
        const marisqueoTallas = tallasMap.get(talla.marisqueo_id) || [];
        marisqueoTallas.push({
          marisqueo_id: talla.marisqueo_id,
          talla: talla.talla,
          frecuencia: talla.frecuencia,
        });
        tallasMap.set(talla.marisqueo_id, marisqueoTallas);
      });
    }

    // Creamos mapas para búsquedas rápidas
    const transectasMap = new Map(transectas.map((t) => [t.id, t]));
    const segmentosMap = new Map(segmentos.map((s) => [s.id, s]));

    // Transformamos los datos a nuestro formato de respuesta
    const marisqueosMapeados = marisqueosData.map((marisqueo: any) => {
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
        tallas: tallasMap.get(marisqueo.id) || [],
      };
    });

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

    // Consultamos la tabla de marisqueos
    const { data: marisqueosData, error: marisqueosError } = await supabase
      .from("marisqueos")
      .select("*, buzo:buzo_id(id, nombre, apellido)")
      .in("segmento_id", segmentosIds);

    if (marisqueosError) {
      console.error("Error al obtener marisqueos:", marisqueosError);
      return { error: marisqueosError.message };
    }

    // Si no hay marisqueos, retornamos array vacío
    if (!marisqueosData || marisqueosData.length === 0) {
      return { data: [] };
    }

    // Obtener todas las tallas de todos los marisqueos en una sola consulta
    const marisqueosIds = marisqueosData.map((m) => m.id);
    const { data: tallasData, error: tallasError } = await supabase
      .from("tallasmarisqueo2")
      .select("*")
      .in("marisqueo_id", marisqueosIds)
      .order("talla", { ascending: true });

    if (tallasError) {
      console.error("Error al obtener tallas:", tallasError);
      // No retornamos error por tallas, seguimos sin ellas
    }

    // Agrupar tallas por marisqueo_id
    const tallasMap = new Map<number, TallaMarisqueo[]>();
    if (tallasData) {
      tallasData.forEach((talla: any) => {
        const marisqueoTallas = tallasMap.get(talla.marisqueo_id) || [];
        marisqueoTallas.push({
          marisqueo_id: talla.marisqueo_id,
          talla: talla.talla,
          frecuencia: talla.frecuencia,
        });
        tallasMap.set(talla.marisqueo_id, marisqueoTallas);
      });
    }

    // Creamos un mapa para buscar segmentos rápidamente
    const segmentosMap = new Map(segmentos.map((s) => [s.id, s]));

    // Transformamos los datos a nuestro formato de respuesta
    const marisqueosMapeados = marisqueosData.map((marisqueo: any) => {
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
        tallas: tallasMap.get(marisqueo.id) || [],
      };
    });

    return { data: marisqueosMapeados };
  } catch (error) {
    console.error("Error al obtener marisqueos:", error);
    return { error: String(error) };
  }
}

/**
 * Crea un nuevo marisqueo en un segmento
 */
export async function createMarisqueoAction(formData: {
  segmento_id: number;
  buzo_id: number;
  n_captura: number;
  coordenadas?: string;
  profundidad?: number;
  tiempo?: number;
  peso_muestra?: number;
}): Promise<{ data?: Tables<"marisqueos">; error?: string }> {
  const supabase = await createClient();

  try {
    const marisqueoData = {
      ...formData,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("marisqueos")
      .insert([marisqueoData])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return { data };
  } catch (error) {
    console.error("Error al crear marisqueo:", error);
    return { error: String(error) };
  }
}

/**
 * Obtiene el último marisqueo creado en un segmento específico
 */
export async function getUltimoMarisqueoAction(
  segmentoId: number
): Promise<{ data?: any; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("marisqueos")
      .select("*")
      .eq("segmento_id", segmentoId)
      .order("n_captura", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 es el código cuando no se encuentra ningún registro
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error("Error al obtener el último marisqueo:", error);
    return { error: String(error) };
  }
}

/**
 * Verifica si ya existe un marisqueo con el número de captura especificado en el segmento
 */
export async function checkMarisqueoCapturaAvailabilityAction(
  segmentoId: number,
  nCaptura: number
): Promise<{ available?: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error, count } = await supabase
      .from("marisqueos")
      .select("*", { count: "exact", head: true })
      .eq("segmento_id", segmentoId)
      .eq("n_captura", nCaptura);

    if (error) {
      return { error: error.message };
    }

    return { available: count === 0 };
  } catch (error) {
    console.error("Error al verificar disponibilidad de captura:", error);
    return { error: String(error) };
  }
}

/**
 * Actualiza un marisqueo existente
 */
export async function updateMarisqueoAction(
  marisqueoId: number,
  formData: {
    segmento_id?: number;
    buzo_id?: number;
    n_captura?: number;
    coordenadas?: string;
    profundidad?: number;
    tiempo?: number;
    peso_muestra?: number;
  }
): Promise<{ data?: Tables<"marisqueos">; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("marisqueos")
      .update(formData)
      .eq("id", marisqueoId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return { data };
  } catch (error) {
    console.error("Error al actualizar marisqueo:", error);
    return { error: String(error) };
  }
}

/**
 * Obtiene un marisqueo específico por su ID con información relacionada
 */
export async function getMarisqueoByIdAction(
  marisqueoId: number
): Promise<{ data?: any; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("marisqueos")
      .select(
        `
        *,
        segmento:segmento_id(
          id,
          numero,
          transecta:transecta_id(
            id,
            nombre
          )
        ),
        buzo:buzo_id(
          id,
          nombre,
          apellido
        )
      `
      )
      .eq("id", marisqueoId)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error("Error al obtener marisqueo:", error);
    return { error: String(error) };
  }
}
