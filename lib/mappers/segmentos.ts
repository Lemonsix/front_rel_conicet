import { Tables } from "@/lib/types/database.types";
import { Segmento } from "../types/segmento";
import {
  parseGeoJSONToCoordinates,
  parseWKTToCoordinates,
  parseWKBHex,
} from "../utils/coordinates";
import { mapCuadrado } from "./cuadrado";
import { mapMarisqueo } from "./marisqueo";

// Tipo extendido para representar el resultado del join complejo
type SegmentoWithRelations = Tables<"segmentos"> & {
  sustrato?: {
    id: number;
    codigo: string | null;
    descripcion: string | null;
  }[];
  marisqueos?: any[];
  cuadrados?: Tables<"cuadrados">[];
};

export function mapSegmento(segmentoDb: SegmentoWithRelations): Segmento {
  // Asegurarse de que coordenadas_inicio y coordenadas_fin sean strings para evitar errores
  const coordInicio = segmentoDb.coordenadas_inicio
    ? String(segmentoDb.coordenadas_inicio)
    : "";
  const coordFin = segmentoDb.coordenadas_fin
    ? String(segmentoDb.coordenadas_fin)
    : "";

  // Debug logs para ver qué formato tienen las coordenadas
  console.log("Coordenadas inicio (raw):", coordInicio);
  console.log("Coordenadas fin (raw):", coordFin);

  // Convertir null a undefined para las profundidades
  const profInicial = segmentoDb.profundidad_inicial ?? undefined;
  const profFinal = segmentoDb.profundidad_final ?? undefined;

  // Intentar parsear como WKB Hex (formato PostGIS) primero
  let coordenadasInicio = null;
  let coordenadasFin = null;

  // Para coordenadas inicio
  if (coordInicio && coordInicio.startsWith("0101000020E6100000")) {
    // Es formato WKB Hex de PostGIS
    coordenadasInicio = parseWKBHex(coordInicio);
  } else if (coordInicio.includes('"type":"Point"')) {
    // Es formato GeoJSON
    coordenadasInicio = parseGeoJSONToCoordinates(coordInicio, profInicial);
  } else if (coordInicio) {
    // Intentar como WKT
    coordenadasInicio = parseWKTToCoordinates(coordInicio, profInicial);
  }

  // Para coordenadas fin
  if (coordFin && coordFin.startsWith("0101000020E6100000")) {
    // Es formato WKB Hex de PostGIS
    coordenadasFin = parseWKBHex(coordFin);
  } else if (coordFin.includes('"type":"Point"')) {
    // Es formato GeoJSON
    coordenadasFin = parseGeoJSONToCoordinates(coordFin, profFinal);
  } else if (coordFin) {
    // Intentar como WKT
    coordenadasFin = parseWKTToCoordinates(coordFin, profFinal);
  }

  // Debug logs para ver el resultado del parseo
  console.log("Coordenadas inicio (parseadas):", coordenadasInicio);
  console.log("Coordenadas fin (parseadas):", coordenadasFin);

  // Si hay un sustrato en el join, lo mapeamos
  const sustrato =
    segmentoDb.sustrato && segmentoDb.sustrato.length > 0
      ? {
          id: segmentoDb.sustrato[0].id,
          codigo: segmentoDb.sustrato[0].codigo || "",
          descripcion: segmentoDb.sustrato[0].descripcion || "",
        }
      : {
          id: segmentoDb.sustrato_id ?? 0,
          codigo: "",
          descripcion: "",
        };

  // Convertir null a undefined para conteo
  const conteo = segmentoDb.conteo ?? undefined;

  // Nos aseguramos que las coordenadas tengan las profundidades correctas
  const coordInicioFinal = coordenadasInicio
    ? {
        ...coordenadasInicio,
        profundidad: profInicial,
      }
    : { latitud: 0, longitud: 0, profundidad: profInicial };

  const coordFinFinal = coordenadasFin
    ? {
        ...coordenadasFin,
        profundidad: profFinal,
      }
    : { latitud: 0, longitud: 0, profundidad: profFinal };

  console.log("Coordenadas finales con profundidad:", {
    inicio: coordInicioFinal,
    fin: coordFinFinal,
  });

  return {
    id: segmentoDb.id,
    transectaId: segmentoDb.transecta_id,
    numero: segmentoDb.numero,
    largo: segmentoDb.largo,
    profundidadInicial: profInicial,
    profundidadFinal: profFinal,
    sustrato: sustrato,
    conteo: conteo,
    estMinima: segmentoDb.est_minima,
    tieneMarisqueo: segmentoDb.tiene_marisqueo === "SI",
    tieneCuadrados: segmentoDb.tiene_cuadrados === "SI",
    coordenadasInicio: coordInicioFinal,
    coordenadasFin: coordFinFinal,
    marisqueos: segmentoDb.marisqueos?.map(mapMarisqueo),
    cuadrados: segmentoDb.cuadrados?.map(mapCuadrado),
  };
}

export function mapSegmentos(segmentosDb: SegmentoWithRelations[]): Segmento[] {
  return segmentosDb.map(mapSegmento);
}
