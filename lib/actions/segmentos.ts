"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Segmento } from "../types/segmento";
import { formatCoordinates } from "../utils/coordinates";
import {
  wktHexToGeoJSON,
  decimalToSexagesimal,
  calcularDistanciaHaversine,
} from "../utils/gps";

// Exportar la función para que esté disponible desde este archivo
export { calcularDistanciaHaversine };

// Función para parsear GeoJSON y convertirlo a coordenadas con formato amigable
function parseGeoJSONToCoordinates(
  geoJSONString: string | null,
  profundidad: number = 0
): any {
  if (!geoJSONString) return null;

  try {
    const geoJSON = JSON.parse(geoJSONString);

    if (
      geoJSON &&
      geoJSON.type === "Point" &&
      Array.isArray(geoJSON.coordinates)
    ) {
      const [longitud, latitud] = geoJSON.coordinates;

      console.log("Coordenadas parseadas:", { longitud, latitud, profundidad });

      // Si ambas coordenadas son 0, posiblemente son coordenadas no establecidas
      if (latitud === 0 && longitud === 0) {
        console.log(
          "Coordenadas en 0,0 detectadas, posiblemente no configuradas"
        );
      }

      // Convertir a formato sexagesimal para UI
      const latSexagesimal = decimalToSexagesimal(latitud, "latitud");
      const lonSexagesimal = decimalToSexagesimal(longitud, "longitud");

      // Formato completo para mostrar en UI
      const displayFormat = `${Math.abs(latSexagesimal.grados)}° ${
        latSexagesimal.minutos
      }' ${latSexagesimal.segundos}" ${latSexagesimal.direccion}, ${Math.abs(
        lonSexagesimal.grados
      )}° ${lonSexagesimal.minutos}' ${lonSexagesimal.segundos}" ${
        lonSexagesimal.direccion
      }`;

      // Devolver objeto con todos los formatos
      return {
        latitud,
        longitud,
        profundidad,
        lat: latitud, // Para compatibilidad
        lng: longitud, // Para compatibilidad
        depth: profundidad, // Para compatibilidad
        sexagesimal: {
          latitud: {
            grados: Math.abs(latSexagesimal.grados),
            minutos: latSexagesimal.minutos,
            segundos: latSexagesimal.segundos,
            direccion: latSexagesimal.direccion,
          },
          longitud: {
            grados: Math.abs(lonSexagesimal.grados),
            minutos: lonSexagesimal.minutos,
            segundos: lonSexagesimal.segundos,
            direccion: lonSexagesimal.direccion,
          },
        },
        display: displayFormat,
      };
    }

    return null;
  } catch (error) {
    console.error("Error parseando GeoJSON:", error, geoJSONString);
    return null;
  }
}

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

export async function updateSegmentoAction(data: {
  id: number;
  transecta_id: number;
  numero: number;
  coordenadas_inicio: string;
  coordenadas_fin: string;
  profundidad_inicial: number;
  profundidad_final: number;
  distancia: number;
  sustrato_id: number;
  conteo?: number;
  est_minima?: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("segmentos")
    .update({
      numero: data.numero,
      coordenadas_inicio: data.coordenadas_inicio,
      coordenadas_fin: data.coordenadas_fin,
      profundidad_inicial: data.profundidad_inicial,
      profundidad_final: data.profundidad_final,
      distancia: data.distancia,
      sustrato_id: data.sustrato_id,
      conteo: data.conteo,
      est_minima: data.est_minima,
    })
    .eq("id", data.id);

  if (error) {
    throw error;
  }
}

export async function getSegmentosByTransectaAction(transectaId: number) {
  const supabase = await createClient();

  console.log("Obteniendo segmentos para transecta ID:", transectaId);

  try {
    // Obtener información básica de los segmentos
    const { data: segmentos, error: segmentosError } = await supabase
      .from("segmentos")
      .select(
        `
        id,
        numero,
        largo,
        profundidad_inicial,
        profundidad_final,
        sustrato:sustratos(id, codigo, descripcion),
        conteo,
        est_minima,
        tiene_marisqueo,
        tiene_cuadrados,
        coordenadas_inicio,
        coordenadas_fin
      `
      )
      .eq("transecta_id", transectaId)
      .order("numero");

    if (segmentosError) {
      console.error("Error al obtener segmentos:", segmentosError);
      return { error: segmentosError.message };
    }

    if (!segmentos || segmentos.length === 0) {
      console.log(
        "No se encontraron segmentos para la transecta:",
        transectaId
      );
      return { data: [] };
    }

    console.log("Segmentos obtenidos:", segmentos.length);

    // Procesar para convertir a GeoJSON
    const segmentosConGeoJSON = segmentos.map((segmento) => {
      // Obtener GeoJSON
      const geoJSONInicio = segmento.coordenadas_inicio
        ? typeof segmento.coordenadas_inicio === "string" &&
          segmento.coordenadas_inicio.includes('"type":"Point"')
          ? segmento.coordenadas_inicio // Ya está en formato GeoJSON
          : wktHexToGeoJSON(segmento.coordenadas_inicio as string)
        : null;

      const geoJSONFin = segmento.coordenadas_fin
        ? typeof segmento.coordenadas_fin === "string" &&
          segmento.coordenadas_fin.includes('"type":"Point"')
          ? segmento.coordenadas_fin // Ya está en formato GeoJSON
          : wktHexToGeoJSON(segmento.coordenadas_fin as string)
        : null;

      // Convertir a coordenadas amigables
      const coordenadasInicio = parseGeoJSONToCoordinates(
        geoJSONInicio,
        segmento.profundidad_inicial
      );

      const coordenadasFin = parseGeoJSONToCoordinates(
        geoJSONFin,
        segmento.profundidad_final
      );

      return {
        ...segmento,
        coordenadasInicio: coordenadasInicio,
        coordenadasFin: coordenadasFin,
        // Mantener formato compatible con el UI existente
        coordenadas_inicio: geoJSONInicio,
        coordenadas_fin: geoJSONFin,
      };
    });

    // Obtener datos relacionados para cada segmento
    const segmentosCompletos = await Promise.all(
      segmentosConGeoJSON.map(async (segmento) => {
        // Obtener marisqueos
        const { data: marisqueos, error: marisqueosError } = await supabase
          .from("marisqueos")
          .select(
            `
            id, 
            segmento_id, 
            timestamp, 
            tiempo,
            coordenadas,
            tiene_muestreo,
            buzo_id,
            n_captura,
            peso_muestra,
            buzo:personas(id, nombre, apellido)
          `
          )
          .eq("segmento_id", segmento.id);

        if (marisqueosError) {
          console.error("Error al obtener marisqueos:", marisqueosError);
        }

        // Obtener cuadrados
        const { data: cuadrados, error: cuadradosError } = await supabase
          .from("cuadrados")
          .select(
            `
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
          `
          )
          .eq("segmento_id", segmento.id);

        if (cuadradosError) {
          console.error("Error al obtener cuadrados:", cuadradosError);
        }

        // Convertir coordenadas de marisqueos y cuadrados a formato amigable
        const marisqueosConGeoJSON =
          marisqueos?.map((m) => {
            const geoJSON = m.coordenadas
              ? typeof m.coordenadas === "string" &&
                m.coordenadas.includes('"type":"Point"')
                ? m.coordenadas
                : wktHexToGeoJSON(m.coordenadas as string)
              : null;

            const coordenadasObj = parseGeoJSONToCoordinates(geoJSON);

            return {
              ...m,
              coordenadas: geoJSON,
              coordenadasObj,
            };
          }) || [];

        const cuadradosConGeoJSON =
          cuadrados?.map((c) => {
            const geoJSONInicio = c.coordenadas_inicio
              ? typeof c.coordenadas_inicio === "string" &&
                c.coordenadas_inicio.includes('"type":"Point"')
                ? c.coordenadas_inicio
                : wktHexToGeoJSON(c.coordenadas_inicio as string)
              : null;

            const geoJSONFin = c.coordenadas_fin
              ? typeof c.coordenadas_fin === "string" &&
                c.coordenadas_fin.includes('"type":"Point"')
                ? c.coordenadas_fin
                : wktHexToGeoJSON(c.coordenadas_fin as string)
              : null;

            const coordenadasInicio = parseGeoJSONToCoordinates(
              geoJSONInicio,
              c.profundidad_inicio
            );
            const coordenadasFin = parseGeoJSONToCoordinates(
              geoJSONFin,
              c.profundidad_fin
            );

            return {
              ...c,
              coordenadasInicio,
              coordenadasFin,
              // Mantener formato compatible
              coordenadas_inicio: geoJSONInicio,
              coordenadas_fin: geoJSONFin,
            };
          }) || [];

        // Preparar el resultado final transformando al formato esperado por el cliente
        const resultado = {
          id: segmento.id,
          transectId: transectaId,
          numero: segmento.numero,
          largo: segmento.largo,
          profundidadInicial: segmento.profundidad_inicial,
          profundidadFinal: segmento.profundidad_final,
          conteo: segmento.conteo,
          estMinima: segmento.est_minima,
          tieneMarisqueo: segmento.tiene_marisqueo === "SI",
          tieneCuadrados: segmento.tiene_cuadrados === "SI",
          sustrato: segmento.sustrato[0],
          sustratoId: segmento.sustrato[0]?.id,
          coordenadasInicio: segmento.coordenadasInicio
            ? {
                latitud: segmento.coordenadasInicio.latitud,
                longitud: segmento.coordenadasInicio.longitud,
                profundidad:
                  segmento.profundidad_inicial ||
                  segmento.coordenadasInicio.profundidad ||
                  0,
              }
            : {
                latitud: 0,
                longitud: 0,
                profundidad: segmento.profundidad_inicial || 0,
              },
          coordenadasFin: segmento.coordenadasFin
            ? {
                latitud: segmento.coordenadasFin.latitud,
                longitud: segmento.coordenadasFin.longitud,
                profundidad:
                  segmento.profundidad_final ||
                  segmento.coordenadasFin.profundidad ||
                  0,
              }
            : {
                latitud: 0,
                longitud: 0,
                profundidad: segmento.profundidad_final || 0,
              },
          distancia: segmento.largo, // Asegurar que distancia esté establecida correctamente
          marisqueos: marisqueosConGeoJSON,
          cuadrados: cuadradosConGeoJSON,
        };
        console.log("Resultado segmento completo:", {
          id: resultado.id,
          coordenadasInicio: resultado.coordenadasInicio,
          coordenadasFin: resultado.coordenadasFin,
        });
        return resultado;
      })
    );
    // Log para debug
    if (segmentosCompletos.length > 0) {
      console.log("Ejemplo de respuesta (primer segmento):", {
        id: segmentosCompletos[0].id,
        coordenadasInicio: segmentosCompletos[0].coordenadasInicio
          ? {
              formatted: formatCoordinates(
                segmentosCompletos[0].coordenadasInicio.latitud,
                segmentosCompletos[0].coordenadasInicio.longitud
              ),
              rawLatitud: segmentosCompletos[0].coordenadasInicio.latitud,
              rawLongitud: segmentosCompletos[0].coordenadasInicio.longitud,
              profundidad: segmentosCompletos[0].coordenadasInicio.profundidad,
            }
          : "No disponible",
        coordenadasFin: segmentosCompletos[0].coordenadasFin
          ? {
              formatted: formatCoordinates(
                segmentosCompletos[0].coordenadasFin.latitud,
                segmentosCompletos[0].coordenadasFin.longitud
              ),
              rawLatitud: segmentosCompletos[0].coordenadasFin.latitud,
              rawLongitud: segmentosCompletos[0].coordenadasFin.longitud,
              profundidad: segmentosCompletos[0].coordenadasFin.profundidad,
            }
          : "No disponible",
        marisqueos_count: segmentosCompletos[0].marisqueos?.length || 0,
        cuadrados_count: segmentosCompletos[0].cuadrados?.length || 0,
      });
    }
    console.log("Segmentos completos:", segmentosCompletos);
    return { data: segmentosCompletos };
  } catch (error) {
    console.error("Error general en getSegmentosByTransectaAction:", error);
    return { error: "Error al obtener segmentos: " + (error as Error).message };
  }
}
