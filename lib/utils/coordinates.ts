import { Coordenada } from "../types/coordenadas";

export function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Garantiza que siempre obtenemos un objeto Coordenada válido,
 * independientemente del formato de entrada.
 *
 * @param input Puede ser un objeto Coordenada, una cadena WKT, o null/undefined
 * @param defaultCoord Coordenada por defecto si la entrada es inválida
 * @returns Un objeto Coordenada válido
 */
export function aseguraCoordenada(
  input: Coordenada | string | null | undefined,
  defaultCoord: Coordenada = Coordenada.fromDecimal(0, 0)
): Coordenada {
  if (!input) return defaultCoord;

  // Si ya es un objeto Coordenada, verificar que tenga la propiedad sexagesimal
  if (typeof input === "object") {
    try {
      if (input.sexagesimal) {
        return input;
      }
    } catch (e) {
      console.error("Error al acceder a la propiedad sexagesimal:", e);
    }
  }

  // Si es una cadena, intentar convertirla
  if (typeof input === "string") {
    if (input.startsWith("SRID=4326;POINT")) {
      const coordObj = Coordenada.fromWKT(input);
      if (coordObj) return coordObj;
    } else if (input.startsWith("0101000020E6100000")) {
      const coordObj = Coordenada.fromWKBHex(input);
      if (coordObj) return coordObj;
    } else if (input.includes('"type":"Point"')) {
      const coordObj = Coordenada.fromGeoJSON(input);
      if (coordObj) return coordObj;
    }
  }

  return defaultCoord;
}

/**
 * Serializa un objeto Coordenada en un objeto plano para transmisión cliente-servidor
 *
 * @param coordenada El objeto Coordenada a serializar
 * @returns Un objeto plano con las propiedades necesarias
 */
export function serializaCoordenada(coordenada?: Coordenada | null): any {
  if (!coordenada) return null;

  try {
    const decimal = coordenada.decimal;
    const sexagesimal = coordenada.sexagesimal;
    const wkb = coordenada.wkb;

    return {
      decimal,
      sexagesimal,
      wkb,
      // No incluimos métodos o propiedades privadas
    };
  } catch (e) {
    console.error("Error al serializar coordenada:", e);
    return null;
  }
}
