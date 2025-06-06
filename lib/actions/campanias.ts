"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database.types";
import {
  mapCampania,
  mapCampaniaWithTransectas,
  mapCampanias,
} from "@/lib/mappers/campania";
import { Campania } from "@/lib/types/campania";

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
  data?: Campania;
  error?: string;
}> {
  const supabase = await createClient();

  // Primera consulta: obtener datos básicos de la campaña
  const { data: campaniaData, error: campaniaError } = await supabase
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
      )
    `
    )
    .eq("id", campaniaId)
    .single();

  if (campaniaError) {
    return { error: campaniaError.message };
  }

  // Segunda consulta: obtener transectas con sus datos relacionados
  const { data: transectasData, error: transectasError } = await supabase
    .from("transectas")
    .select(
      `
      id,
      nombre,
      observaciones,
      fecha,
      hora_inicio,
      hora_fin,
      sentido,
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
    `
    )
    .eq("campania_id", campaniaId);

  if (transectasError) {
    return { error: transectasError.message };
  }

  // Tercera consulta: obtener primer y último segmento de cada transecta usando window functions
  const transectaIds = transectasData.map((t) => t.id);

  if (transectaIds.length > 0) {
    const { data: segmentosData, error: segmentosError } = await supabase.rpc(
      "get_first_last_segments_by_transectas",
      {
        transecta_ids: transectaIds,
      }
    );

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);
      // Fallback a la consulta anterior si la función RPC falla
      const transectasConSegmentos = [];

      for (const t of transectasData) {
        // Primer segmento (usando numero de segmento en orden ascendente)
        const { data: firstSeg, error: fError } = await supabase
          .from("segmentos")
          .select("*")
          .eq("transecta_id", t.id)
          .order("numero", { ascending: true })
          .limit(1);

        if (fError) {
          console.error(
            `Error al obtener primer segmento de transecta ${t.id}:`,
            fError
          );
        }

        // Último segmento (usando numero de segmento en orden descendente)
        const { data: lastSeg, error: lError } = await supabase
          .from("segmentos")
          .select("*")
          .eq("transecta_id", t.id)
          .order("numero", { ascending: false })
          .limit(1);

        if (lError) {
          console.error(
            `Error al obtener último segmento de transecta ${t.id}:`,
            lError
          );
        }

        transectasConSegmentos.push({
          ...t,
          firstSegment: firstSeg?.[0] || null,
          lastSegment: lastSeg?.[0] || null,
        });
      }

      const campaniaMapeada = mapCampaniaWithTransectas({
        campania: { ...campaniaData, transectas: transectasConSegmentos },
        transectas: transectasConSegmentos,
      });

      return { data: campaniaMapeada };
    }

    // Crear un mapa de segmentos por transecta_id
    const segmentosPorTransecta: Record<number, { first?: any; last?: any }> =
      {};

    segmentosData?.forEach((seg: any) => {
      if (!segmentosPorTransecta[seg.transecta_id]) {
        segmentosPorTransecta[seg.transecta_id] = {};
      }

      if (seg.segment_position === "first") {
        segmentosPorTransecta[seg.transecta_id].first = seg;
      } else if (seg.segment_position === "last") {
        segmentosPorTransecta[seg.transecta_id].last = seg;
      }
    });

    // Combinar transectas con sus segmentos
    const transectasConSegmentos = transectasData.map((t) => ({
      ...t,
      firstSegment: segmentosPorTransecta[t.id]?.first || null,
      lastSegment: segmentosPorTransecta[t.id]?.last || null,
    }));

    // Utilizar el mapper especializado para convertir los datos
    const campaniaMapeada = mapCampaniaWithTransectas({
      campania: { ...campaniaData, transectas: transectasConSegmentos },
      transectas: transectasConSegmentos,
    });

    return { data: campaniaMapeada };
  }

  // Si no hay transectas, devolver solo los datos de campaña
  const campaniaMapeada = mapCampaniaWithTransectas({
    campania: { ...campaniaData, transectas: [] },
    transectas: [],
  });

  return { data: campaniaMapeada };
}
