import { Tables } from "@/lib/types/database.types";
import { Segmento } from "../types/segmento";
import { Coordenada } from "../types/coordenadas";
import { mapCuadrado } from "./cuadrado";
import { mapMarisqueo } from "./marisqueo";
import { serializaCoordenada } from "../utils/coordinates";

// Tipo extendido para representar el resultado del join complejo
type SegmentoWithRelations = Tables<"segmentos"> & {
  sustrato?: {
    id: number;
    codigo: string | null;
    descripcion: string | null;
  };
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

  // Convertir null a undefined para las profundidades
  const profInicial = segmentoDb.profundidad_inicial ?? undefined;
  const profFinal = segmentoDb.profundidad_final ?? undefined;

  // Intentar crear coordenadas desde los diferentes formatos posibles
  let coordenadasInicio: Coordenada | null = null;
  let coordenadasFin: Coordenada | null = null;

  // Para coordenadas inicio
  if (coordInicio && coordInicio.startsWith("0101000020E6100000")) {
    // Es formato WKB Hex de PostGIS
    coordenadasInicio = Coordenada.fromWKBHex(coordInicio);
  } else if (coordInicio.includes('"type":"Point"')) {
    // Es formato GeoJSON
    coordenadasInicio = Coordenada.fromGeoJSON(coordInicio);
  } else if (coordInicio.startsWith("SRID=4326;POINT")) {
    // Intentar como WKT
    coordenadasInicio = Coordenada.fromWKT(coordInicio);
  }

  // Para coordenadas fin
  if (coordFin && coordFin.startsWith("0101000020E6100000")) {
    // Es formato WKB Hex de PostGIS
    coordenadasFin = Coordenada.fromWKBHex(coordFin);
  } else if (coordFin.includes('"type":"Point"')) {
    // Es formato GeoJSON
    coordenadasFin = Coordenada.fromGeoJSON(coordFin);
  } else if (coordFin.startsWith("SRID=4326;POINT")) {
    // Intentar como WKT
    coordenadasFin = Coordenada.fromWKT(coordFin);
  }

  // Si hay un sustrato en el join, lo mapeamos
  const sustrato = segmentoDb.sustrato
    ? {
        id: segmentoDb.sustrato.id,
        codigo: segmentoDb.sustrato.codigo || "",
        descripcion: segmentoDb.sustrato.descripcion || "",
      }
    : {
        id: segmentoDb.sustrato_id ?? 0,
        codigo: "",
        descripcion: "",
      };

  // Convertir null a undefined para conteo
  const conteo = segmentoDb.conteo ?? undefined;

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
    coordenadasInicio: serializaCoordenada(
      coordenadasInicio || Coordenada.fromDecimal(0, 0)
    ),
    coordenadasFin: serializaCoordenada(
      coordenadasFin || Coordenada.fromDecimal(0, 0)
    ),
    marisqueos: segmentoDb.marisqueos?.map(mapMarisqueo),
    cuadrados: segmentoDb.cuadrados?.map(mapCuadrado),
  };
}

export function mapSegmentos(segmentosDb: SegmentoWithRelations[]): Segmento[] {
  return segmentosDb.map(mapSegmento);
}
