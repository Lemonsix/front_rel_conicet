"use server";

import { Tables, TablesInsert } from "@/lib/types/database.types";
import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { mapTransectas } from "../mappers/transecta";

export async function getTransectasByCampaniaAction(
  campaniaId: number
): Promise<{
  data?: any[];
  error?: string;
}> {
  const supabase = await createClient();
  try {
    // Verificar si hay segmentos en la base de datos
    const { count: segmentosCount, error: countError } = await supabase
      .from("segmentos")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error al contar segmentos:", countError);
    } else {
      console.log(`Total de segmentos en la base de datos: ${segmentosCount}`);
    }

    // Primero recuperamos las transectas de esta campaña con sus relaciones
    const { data: transectas, error: transectasError } = await supabase
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
        largo_manguera,
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
      console.error("Error al obtener transectas:", transectasError);
      return { error: transectasError.message };
    }

    if (!transectas || transectas.length === 0) {
      console.log("No se encontraron transectas para la campaña:", campaniaId);
      return { data: [] };
    }

    // Función auxiliar para ordenación numérica natural
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });

    // Ordenar transectas por nombre usando ordenación numérica natural
    const transectasOrdenadas = [...transectas].sort((a, b) =>
      collator.compare(a.nombre, b.nombre)
    );

    // Extraemos los IDs de transectas para buscar sus segmentos
    const transectasIds = transectasOrdenadas.map((t) => t.id);

    // Verificar que los IDs sean números válidos
    const idsValidos = transectasIds.filter(
      (id) => Number.isInteger(id) && id > 0
    );
    if (idsValidos.length !== transectasIds.length) {
      console.error(
        "¡ATENCIÓN! Algunos IDs de transectas no son válidos:",
        transectasIds.filter((id) => !Number.isInteger(id) || id <= 0)
      );
    }

    // Si hay pocos IDs, podríamos intentar consultas individuales para cada transecta
    if (transectasIds.length > 0 && transectasIds.length < 5) {
      for (const id of transectasIds) {
        const { data: segsIndividuales, error: errorIndividual } =
          await supabase
            .from("segmentos")
            .select("id, transecta_id, numero")
            .eq("transecta_id", id);

        if (errorIndividual) {
          console.error(
            `Error consultando segmentos para transecta ${id}:`,
            errorIndividual
          );
        }
      }
    }

    // Intento alternativo: consulta sin usar .in() para ver si funciona
    if (transectasIds.length > 0) {
      const idsList = transectasIds.join(",");
      const query = `transecta_id in (${idsList})`;

      try {
        // Intentemos una consulta con otro enfoque
        const { data: segmentosAlt, error: errorAlt } = await supabase
          .from("segmentos")
          .select("id, transecta_id")
          .or(transectasIds.map((id) => `transecta_id.eq.${id}`).join(","));

        if (errorAlt) {
          console.error("Error en consulta alternativa:", errorAlt);
        } else if (segmentosAlt && segmentosAlt.length > 0) {
          // Mostrar distribución
          const distribPorId: Record<string, number> = {};
          segmentosAlt.forEach((seg) => {
            const id = seg.transecta_id.toString();
            distribPorId[id] = (distribPorId[id] || 0) + 1;
          });
        }
      } catch (error) {
        console.error("Error ejecutando consulta alternativa:", error);
      }
    }

    // Para depuración, obtenemos un segmento de cualquier transecta para ver su estructura
    const { data: sampleSegmentos, error: sampleError } = await supabase
      .from("segmentos")
      .select("*")
      .limit(1);

    if (sampleError) {
      console.error("Error al obtener un segmento de muestra:", sampleError);
    } else if (sampleSegmentos && sampleSegmentos.length > 0) {
      // Intentar consultar segmentos con el mismo transecta_id que este ejemplo
      const ejemploId = sampleSegmentos[0].transecta_id;

      const { data: segEjemplo, error: errorEjemplo } = await supabase
        .from("segmentos")
        .select("id, numero, transecta_id")
        .eq("transecta_id", ejemploId);

      if (errorEjemplo) {
        console.error(
          `Error consultando segmentos del ejemplo (id=${ejemploId}):`,
          errorEjemplo
        );
      } else {
        // Verificar si alguna de nuestras transectas está en la base de datos
        const idExisteEnNuestrasTransectas = transectasIds.includes(ejemploId);
      }
    } else {
      console.error(
        "¡ALERTA! No se encontraron segmentos en absoluto en la base de datos"
      );
    }

    // Ahora obtenemos todos los segmentos para nuestras transectas
    const { data: segmentosData, error: segmentosError } = await supabase
      .from("segmentos")
      .select(
        `
        id,
        transecta_id,
        numero,
        largo,
        conteo,
        est_minima,
        profundidad_inicial,
        profundidad_final,
        coordenadas_inicio,
        coordenadas_fin,
        tiene_marisqueo,
        tiene_cuadrados,
        sustrato_id
      `
      )
      .in("transecta_id", transectasIds)
      .order("transecta_id, numero");

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);

      try {
        const idsList = transectasIds.join(",");
        const { data: segmentosSql, error: errorSql } = await supabase.rpc(
          "get_segmentos_por_transectas",
          { transecta_ids: transectasIds }
        );

        if (errorSql) {
          console.error("Error en consulta SQL:", errorSql);
        } else if (segmentosSql) {
          // Si la consulta RPC funcionó, usamos estos datos
          return { data: mapTransectas(segmentosSql) };
        }
      } catch (sqlError) {
        console.error("Error ejecutando SQL alternativo:", sqlError);
      }

      // Si llegamos aquí, hubo un error y no tenemos alternativa
      return { error: segmentosError.message };
    }

    // Verificar si hay segmentos y mostrar información
    if (!segmentosData || segmentosData.length === 0) {
      // Para depuración, consultamos directamente por una transecta específica
      if (transectasIds.length > 0) {
        const pruebaId = transectasIds[0];

        const { data: segmentosPrueba, error: errorPrueba } = await supabase
          .from("segmentos")
          .select("id, transecta_id, numero")
          .eq("transecta_id", pruebaId);

        if (errorPrueba) {
          console.error(`Error en prueba específica: ${errorPrueba.message}`);
        } else {
          console.log(
            `Resultado prueba: ${segmentosPrueba?.length || 0} segmentos`
          );
        }
      }
    } else {
      // Mostrar distribución de segmentos por transecta
      const segmentosPorTransecta: Record<string, number> = {};
      segmentosData.forEach((seg) => {
        const tid = seg.transecta_id.toString();
        segmentosPorTransecta[tid] = (segmentosPorTransecta[tid] || 0) + 1;
      });

      // Verificar si alguna transecta no tiene segmentos
      const transectasSinSegmentos = transectasIds.filter(
        (id) => !segmentosData.some((seg) => seg.transecta_id === id)
      );

      if (transectasSinSegmentos.length > 0) {
        console.log(
          `Transectas sin segmentos: ${transectasSinSegmentos.join(", ")}`
        );
      }
    }

    // Organizamos segmentos por transecta
    const segmentosPorTransecta: Record<number, any[]> = {};
    segmentosData?.forEach((segmento) => {
      const transectaId = segmento.transecta_id;
      if (!segmentosPorTransecta[transectaId]) {
        segmentosPorTransecta[transectaId] = [];
      }
      segmentosPorTransecta[transectaId].push(segmento);
    });

    // Obtenemos datos adicionales: embarcaciones y buzos
    const { data: embarcaciones, error: embarcacionesError } = await supabase
      .from("embarcaciones")
      .select("id, nombre, matricula");

    if (embarcacionesError) {
      console.error("Error al obtener embarcaciones:", embarcacionesError);
    }

    const { data: buzos, error: buzosError } = await supabase
      .from("personas")
      .select("id, nombre, apellido, rol");

    if (buzosError) {
      console.error("Error al obtener buzos:", buzosError);
    }

    // Crear mapas para acceso rápido
    const embarcacionesMap = new Map(
      embarcaciones?.map((e) => [e.id, e]) || []
    );
    const buzosMap = new Map(buzos?.map((b) => [b.id, b]) || []);

    // Construimos los objetos de transecta completos
    const transectasConRelaciones = transectasOrdenadas.map((transecta) => {
      const transectaId = transecta.id;
      const segmentosDeTransecta = segmentosPorTransecta[transectaId] || [];

      // Ordenamos los segmentos por número
      const segmentosOrdenados = [...segmentosDeTransecta].sort(
        (a, b) => a.numero - b.numero
      );

      // Obtenemos primer y último segmento (si existen)
      const primerSegmento =
        segmentosOrdenados.length > 0 ? segmentosOrdenados[0] : null;
      const ultimoSegmento =
        segmentosOrdenados.length > 0
          ? segmentosOrdenados[segmentosOrdenados.length - 1]
          : null;

      return {
        ...transecta,
        // Profundidad inicial: primero de la transecta, luego del primer segmento
        profundidad_inicial:
          transecta.profundidad_inicial !== null
            ? transecta.profundidad_inicial
            : primerSegmento?.profundidad_inicial || null,

        // Profundidad final: del último segmento si existe
        profundidad_final: ultimoSegmento?.profundidad_final || null,

        // Coordenadas de inicio: del primer segmento si existe
        coordenadas_inicio: primerSegmento?.coordenadas_inicio || null,

        // Coordenadas de fin: del último segmento si existe
        coordenadas_fin: ultimoSegmento?.coordenadas_fin || null,

        // Metadatos
        cantidad_segmentos: segmentosOrdenados.length,

        // Relaciones
        embarcacion: transecta.embarcacion_id
          ? embarcacionesMap.get(transecta.embarcacion_id)
          : null,
        buzo: transecta.buzo_id ? buzosMap.get(transecta.buzo_id) : null,

        // Array de segmentos
        segmentos: segmentosOrdenados,
      };
    });

    // Crear un resumen para depuración
    const resumen = transectasConRelaciones.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      segmentos: t.segmentos.length,
      prof_inicial: t.profundidad_inicial,
      prof_final: t.profundidad_final,
      tiene_coordenadas_inicio: !!t.coordenadas_inicio,
      tiene_coordenadas_fin: !!t.coordenadas_fin,
      hora_inicio: t.hora_inicio,
      hora_fin: t.hora_fin,
    }));

    // Mapeamos las transectas al formato final
    const transectasMapeadas = mapTransectas(transectasConRelaciones);

    // Mostramos resumen del resultado
    const resumenFinal = transectasMapeadas.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      segmentos: t.segmentos?.length || 0,
      profInicial: t.profundidadInicial,
      profFinal: t.profundidadFinal,
      puntoInicio: !!t.puntoInicio,
      puntoFin: !!t.puntoFin,
    }));

    return { data: transectasMapeadas };
  } catch (error) {
    console.error("Error inesperado en getTransectasByCampaniaAction:", error);
    return { error: String(error) };
  }
}

export async function getTransectaByIdAction(transectaId: number): Promise<{
  data?: any;
  error?: string;
}> {
  const supabase = await createClient();
  try {
    const { data: transecta, error: transectaError } = await supabase
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
        largo_manguera,
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
      .eq("id", transectaId)
      .single();

    if (transectaError) {
      console.error("Error al obtener transecta:", transectaError);
      return { error: transectaError.message };
    }

    if (!transecta) {
      return { error: "Transecta no encontrada" };
    }

    // Transformar la transecta para que sea compatible con el mapper
    const transectaTransformada = {
      ...transecta,
      embarcacion: Array.isArray(transecta.embarcacion)
        ? transecta.embarcacion[0] || null
        : transecta.embarcacion,
      buzo: Array.isArray(transecta.buzo)
        ? transecta.buzo[0] || null
        : transecta.buzo,
      // Agregar propiedades que esperan el mapper pero no están en la tabla
      profundidad_final: null,
      coordenadas_inicio: null,
      coordenadas_fin: null,
    };

    // Mapear la transecta individual
    const transectasMapeadas = mapTransectas([transectaTransformada]);
    return { data: transectasMapeadas[0] };
  } catch (error) {
    console.error("Error en getTransectaByIdAction:", error);
    return { error: "Error interno del servidor" };
  }
}

export async function createTransectaAction(
  formData: TablesInsert<"transectas">
): Promise<{
  data?: Tables<"transectas">;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("transectas")
      .insert([formData])
      .select()
      .single();

    if (error) {
      console.error("Error al crear transecta:", error);
      return { error: error.message };
    }

    // Revalidate paths more comprehensively
    const campaniaPath = `/campanias/${formData.campania_id}`;
    revalidatePath(campaniaPath);
    revalidatePath(`/campanias`);
    revalidatePath("/", "layout");

    // Also revalidate the specific transecta path if it exists
    if (data?.id) {
      revalidatePath(`${campaniaPath}/transectas/${data.id}`);
    }

    return { data };
  } catch (error) {
    console.error("Error inesperado al crear transecta:", error);
    return { error: String(error) };
  }
}

export async function getNombresTransectasAction(): Promise<{
  data?: string[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transectas_templates")
    .select("nombre")
    .order("nombre");

  if (error) {
    return { error: error.message };
  }

  // Obtener nombres únicos
  const nombresUnicos = [...new Set(data.map((t) => t.nombre))];

  return { data: nombresUnicos };
}
