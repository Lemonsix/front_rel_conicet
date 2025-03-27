import { Marisqueo } from "../types/marisqueo";
import { Tables } from "@/lib/types/database.types";
import { Coordenada } from "../types/coordenadas";

// Extendemos el tipo para incluir el resultado del join con buzo
type MarisqueoWithBuzo = Tables<"marisqueos"> & {
  buzo?: {
    id: number;
    nombre: string;
    apellido: string;
  };
};

export function mapMarisqueo(marisqueoDb: MarisqueoWithBuzo): Marisqueo {
  // Asegurarse de que coordenadas sea un string para evitar errores
  const coordStr = marisqueoDb.coordenadas
    ? String(marisqueoDb.coordenadas)
    : "";

  // Intentar crear coordenadas desde los diferentes formatos posibles
  let coordenadas: Coordenada | null = null;

  // Si es GeoJSON
  if (coordStr.includes('"type":"Point"')) {
    coordenadas = Coordenada.fromGeoJSON(coordStr);
  }
  // Si es WKB
  else if (coordStr.startsWith("0101000020E6100000")) {
    coordenadas = Coordenada.fromWKBHex(coordStr);
  }
  // Si es WKT
  else if (coordStr.startsWith("SRID=4326;POINT")) {
    coordenadas = Coordenada.fromWKT(coordStr);
  }

  return {
    id: marisqueoDb.id,
    segmentoId: marisqueoDb.segmento_id,
    timestamp: marisqueoDb.timestamp || new Date().toISOString(),
    tiempo: marisqueoDb.tiempo || 0,
    coordenadas: coordenadas || Coordenada.fromDecimal(0, 0),
    tieneMuestreo: marisqueoDb.tiene_muestreo === true,
    buzoId: marisqueoDb.buzo_id,
    nCaptura: marisqueoDb.n_captura,
    pesoMuestra: marisqueoDb.peso_muestra || 0,
    buzo: marisqueoDb.buzo
      ? {
          id: marisqueoDb.buzo.id,
          nombre: marisqueoDb.buzo.nombre,
          apellido: marisqueoDb.buzo.apellido,
          rol: "BUZO",
        }
      : undefined,
  };
}
