"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables } from "@/lib/types/database.types";
import { MuestreoCuadrado } from "../types/cuadrado";



/**
 * Obtiene todos los muestreos asociados a un cuadrado específico
 */
export async function getMuestreosByCuadradoAction(cuadradoId: number): Promise<{
  data?: MuestreoCuadrado[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("cuadrados_muestreos")
      .select("*")
      .eq("cuadrado_id", cuadradoId)
      .order("id", { ascending: true });

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("Error al obtener muestreos del cuadrado:", error);
    return { error: String(error) };
  }
}

/**
 * Crea un nuevo muestreo para un cuadrado
 */
export async function createMuestreoCuadradoAction(muestreoData: {
  cuadrado_id: number;
  talla: number;
}): Promise<{ data?: Tables<"cuadrados_muestreos">; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("cuadrados_muestreos")
      .insert([{
        cuadrado_id: muestreoData.cuadrado_id,
        talla: muestreoData.talla,
        peso_tot: null,
        peso_val: null,
        peso_callo: null,
      }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return { data };
  } catch (error) {
    console.error("Error al crear muestreo:", error);
    return { error: String(error) };
  }
}

/**
 * Actualiza un muestreo existente
 */
export async function updateMuestreoCuadradoAction(
  cuadradoId: number,
  muestreoId: number,
  muestreoData: {
    talla?: number | null;
    peso_tot?: number | null;
    peso_val?: number | null;
    peso_callo?: number | null;
  }
): Promise<{ data?: Tables<"cuadrados_muestreos">; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("cuadrados_muestreos")
      .update(muestreoData)
      .eq("cuadrado_id", cuadradoId)
      .eq("id", muestreoId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return { data };
  } catch (error) {
    console.error("Error al actualizar muestreo:", error);
    return { error: String(error) };
  }
}

/**
 * Elimina un muestreo específico
 */
export async function deleteMuestreoCuadradoAction(
  cuadradoId: number,
  muestreoId: number
): Promise<{ error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("cuadrados_muestreos")
      .delete()
      .eq("cuadrado_id", cuadradoId)
      .eq("id", muestreoId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return {};
  } catch (error) {
    console.error("Error al eliminar muestreo:", error);
    return { error: String(error) };
  }
} 