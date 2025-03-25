import { Cuadrado } from "../types/cuadrado";
import { Tables } from "@/lib/types/database.types";
import {
  parseGeoJSONToCoordinates,
  wktHexToGeoJSON,
} from "../utils/coordinates";

export function mapCuadrado(cuadradoDb: Tables<"cuadrados">): Cuadrado {
  // Asegurarse de que coordenadas_inicio y coordenadas_fin sean strings para evitar errores
  const coordInicio = cuadradoDb.coordenadas_inicio
    ? String(cuadradoDb.coordenadas_inicio)
    : "";
  const coordFin = cuadradoDb.coordenadas_fin
    ? String(cuadradoDb.coordenadas_fin)
    : "";

  const geoJSONInicio = coordInicio.includes('"type":"Point"')
    ? coordInicio
    : wktHexToGeoJSON(coordInicio);
  const geoJSONFin = coordFin.includes('"type":"Point"')
    ? coordFin
    : wktHexToGeoJSON(coordFin);

  const profInicio = cuadradoDb.profundidad_inicio || undefined;
  const profFin = cuadradoDb.profundidad_fin || undefined;

  const coordenadasInicio = parseGeoJSONToCoordinates(
    geoJSONInicio,
    profInicio
  );
  const coordenadasFin = parseGeoJSONToCoordinates(geoJSONFin, profFin);

  return {
    id: cuadradoDb.id,
    segmentoId: cuadradoDb.segmento_id,
    replica: cuadradoDb.replica,
    coordenadasInicio: coordenadasInicio
      ? JSON.stringify(coordenadasInicio)
      : "",
    coordenadasFin: coordenadasFin ? JSON.stringify(coordenadasFin) : "",
    profundidadInicio: cuadradoDb.profundidad_inicio?.toString() || "0",
    profundidadFin: cuadradoDb.profundidad_fin?.toString() || "0",
    tieneMuestreo: cuadradoDb.tiene_muestreo === "SI",
    conteo: cuadradoDb.conteo || 0,
    tamanio: cuadradoDb.tamanio,
    timestamp: cuadradoDb.timestamp || new Date().toISOString(),
  };
}
