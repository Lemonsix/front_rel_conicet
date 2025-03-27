import { Cuadrado } from "../types/cuadrado";
import { Tables } from "@/lib/types/database.types";
import { Coordenada } from "../types/coordenadas";

export function mapCuadrado(cuadradoDb: Tables<"cuadrados">): Cuadrado {
  // Asegurarse de que coordenadas_inicio y coordenadas_fin sean strings para evitar errores
  const coordInicio = cuadradoDb.coordenadas_inicio
    ? String(cuadradoDb.coordenadas_inicio)
    : "";
  const coordFin = cuadradoDb.coordenadas_fin
    ? String(cuadradoDb.coordenadas_fin)
    : "";

  // Intentar crear coordenadas desde los diferentes formatos posibles
  let coordenadasInicio: Coordenada | null = null;
  let coordenadasFin: Coordenada | null = null;

  // Si es GeoJSON
  if (coordInicio.includes('"type":"Point"')) {
    coordenadasInicio = Coordenada.fromGeoJSON(coordInicio);
  }
  // Si es WKB
  else if (
    coordInicio.startsWith("SRID=4326;POINT") ||
    coordInicio.startsWith("0101000020E6100000")
  ) {
    const isHex = coordInicio.startsWith("0101000020E6100000");
    coordenadasInicio = isHex
      ? Coordenada.fromWKBHex(coordInicio)
      : coordInicio
      ? Coordenada.fromWKT(coordInicio)
      : null;
  }

  // Mismo proceso para coordenadas fin
  if (coordFin.includes('"type":"Point"')) {
    coordenadasFin = Coordenada.fromGeoJSON(coordFin);
  } else if (
    coordFin.startsWith("SRID=4326;POINT") ||
    coordFin.startsWith("0101000020E6100000")
  ) {
    const isHex = coordFin.startsWith("0101000020E6100000");
    coordenadasFin = isHex
      ? Coordenada.fromWKBHex(coordFin)
      : coordFin
      ? Coordenada.fromWKT(coordFin)
      : null;
  }

  return {
    id: cuadradoDb.id,
    segmentoId: cuadradoDb.segmento_id,
    replica: cuadradoDb.replica,
    coordenadasInicio: coordenadasInicio || Coordenada.fromDecimal(0, 0),
    coordenadasFin: coordenadasFin || Coordenada.fromDecimal(0, 0),
    profundidadInicio: cuadradoDb.profundidad_inicio?.toString() || "0",
    profundidadFin: cuadradoDb.profundidad_fin?.toString() || "0",
    tieneMuestreo: cuadradoDb.tiene_muestreo === "SI",
    conteo: cuadradoDb.conteo || 0,
    tamanio: cuadradoDb.tamanio,
    timestamp: cuadradoDb.timestamp || new Date().toISOString(),
  };
}
