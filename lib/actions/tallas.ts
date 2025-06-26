"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Tables } from "@/lib/types/database.types";
import { TallaMarisqueo } from "@/lib/types/marisqueos";

/**
 * Obtiene todas las tallas asociadas a un marisqueo específico
 */
export async function getTallasByMarisqueoAction(marisqueoId: number): Promise<{
  data?: TallaMarisqueo[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("tallasmarisqueo2")
      .select("*")
      .eq("marisqueo_id", marisqueoId)
      .order("talla", { ascending: true });

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("Error al obtener tallas del marisqueo:", error);
    return { error: String(error) };
  }
}

/**
 * Crea una nueva talla para un marisqueo
 */
export async function createTallaMarisqueoAction(tallaData: {
  marisqueo_id: number;
  talla: number;
  frecuencia: number;
}): Promise<{ data?: Tables<"tallasmarisqueo2">; error?: string }> {
  const supabase = await createClient();

  try {
    // Verificar si ya existe una talla con el mismo valor para este marisqueo
    const { data: existingTalla, error: checkError } = await supabase
      .from("tallasmarisqueo2")
      .select("*")
      .eq("marisqueo_id", tallaData.marisqueo_id)
      .eq("talla", tallaData.talla)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return { error: checkError.message };
    }

    if (existingTalla) {
      return { error: "Ya existe una talla con ese valor para este marisqueo" };
    }

    const { data, error } = await supabase
      .from("tallasmarisqueo2")
      .insert([tallaData])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return { data };
  } catch (error) {
    console.error("Error al crear talla:", error);
    return { error: String(error) };
  }
}

/**
 * Actualiza una talla existente
 */
export async function updateTallaMarisqueoAction(
  marisqueoId: number,
  tallaOriginal: number,
  tallaData: {
    talla: number;
    frecuencia: number;
  }
): Promise<{ data?: Tables<"tallasmarisqueo2">; error?: string }> {
  const supabase = await createClient();

  try {
    // Si la talla cambió, verificar que no exista otra con el nuevo valor
    if (tallaData.talla !== tallaOriginal) {
      const { data: existingTalla, error: checkError } = await supabase
        .from("tallasmarisqueo2")
        .select("*")
        .eq("marisqueo_id", marisqueoId)
        .eq("talla", tallaData.talla)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        return { error: checkError.message };
      }

      if (existingTalla) {
        return {
          error: "Ya existe una talla con ese valor para este marisqueo",
        };
      }
    }

    const { data, error } = await supabase
      .from("tallasmarisqueo2")
      .update(tallaData)
      .eq("marisqueo_id", marisqueoId)
      .eq("talla", tallaOriginal)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return { data };
  } catch (error) {
    console.error("Error al actualizar talla:", error);
    return { error: String(error) };
  }
}

/**
 * Elimina una talla específica
 */
export async function deleteTallaMarisqueoAction(
  marisqueoId: number,
  talla: number
): Promise<{ error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("tallasmarisqueo2")
      .delete()
      .eq("marisqueo_id", marisqueoId)
      .eq("talla", talla);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/campanias");
    return {};
  } catch (error) {
    console.error("Error al eliminar talla:", error);
    return { error: String(error) };
  }
}
