import { Marisqueo } from "../types/marisqueo";
import { Tables } from "@/lib/types/database.types";
import {
  parseGeoJSONToCoordinates,
  wktHexToGeoJSON,
} from "../utils/coordinates";

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

  const geoJSON = coordStr.includes('"type":"Point"')
    ? coordStr
    : wktHexToGeoJSON(coordStr);

  const coordenadas = parseGeoJSONToCoordinates(geoJSON);

  return {
    id: marisqueoDb.id,
    segmentoId: marisqueoDb.segmento_id,
    timestamp: marisqueoDb.timestamp || new Date().toISOString(),
    tiempo: marisqueoDb.tiempo || 0,
    coordenadas: coordenadas ? JSON.stringify(coordenadas) : "",
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
