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

  const campData = data;
  // 2) Para cada transecta, hacemos 2 consultas: la primera y la última
  const transectas = campData.transectas;
  const transectasConSegmentos = [];

  for (const t of transectas) {
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

  // Utilizar el mapper especializado para convertir los datos
  const campaniaMapeada = mapCampaniaWithTransectas({
    campania: campData,
    transectas: transectasConSegmentos,
  });

  return { data: campaniaMapeada };
}
