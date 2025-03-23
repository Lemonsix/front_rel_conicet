"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCampaniaAction(formData: {
  nombre: string;
  responsable_id: string;
  observaciones?: string;
  inicio: string;
}) {
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

export async function getCampaniasAction() {
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

export async function getCampaniaByIdAction(campaniaId: string) {
  const supabase = await createClient();

  // Obtener datos de la campaña
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

  // Obtener transectas de la campaña
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
      segmentos!inner(
        id,
        numero,
        largo,
        profundidad_inicial,
        profundidad_final,
        sustrato:sustratos!segmentos_fk_sustratos(
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

  if (transectasError) {
    return { error: transectasError.message };
  }

  return { data: { campania: campaniaData, transectas: transectasData } };
}

export async function createTransectaAction(formData: {
  nombre: string;
  observaciones?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  profundidad_inicial: number;
  orientacion: string;
  embarcacion_id?: number;
  buzo_id?: number;
  campania_id: number;
}) {
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

export async function getEmbarcacionesAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("embarcaciones")
    .select("id, nombre, matricula");

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getBuzosAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre, apellido, rol")
    .eq("rol", "BUZO");

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getNombresTransectasAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transectas")
    .select("nombre")
    .order("nombre");

  if (error) {
    return { error: error.message };
  }

  // Obtener nombres únicos
  const nombresUnicos = [...new Set(data.map((t) => t.nombre))];

  return { data: nombresUnicos };
}
