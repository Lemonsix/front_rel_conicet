import { decimalToSexagesimal } from "./gps";

/**
 * Convierte formato sexagesimal (grados, minutos, segundos) a grados decimales
 * Acepta formatos como: "41° 24' 12.2"" o "-41° 24' 12.2""
 */
export function sexagesimalToDecimal(sexagesimal: string): number {
  const match = sexagesimal.match(/(-?)(\d+)°\s*(\d+)'\s*(\d+\.?\d*)"/);
  if (!match) throw new Error("Formato inválido. Use: DD° MM' SS.SS\"");

  const [, sign, degrees, minutes, seconds] = match;
  const decimal =
    parseInt(degrees) + parseInt(minutes) / 60 + parseFloat(seconds) / 3600;

  return sign === "-" ? -decimal : decimal;
}

/**
 * Convierte coordenadas decimales a formato WKT de PostGIS
 */
export function decimalToWKT(lon: number, lat: number): string {
  return `SRID=4326;POINT(${lon} ${lat})`;
}

/**
 * Formatea coordenadas para mostrar en la UI
 */
export function formatCoordinates(lat: number, lon: number): string {
  if (lat === 0 && lon === 0) {
    return "Sin coordenadas";
  }

  const latSex = decimalToSexagesimal(lat, "latitud");
  const lonSex = decimalToSexagesimal(lon, "longitud");

  // Usamos las propiedades del objeto para formatear
  return `${Math.abs(latSex.grados)}° ${latSex.minutos}' ${latSex.segundos}" ${
    latSex.direccion
  }, ${Math.abs(lonSex.grados)}° ${lonSex.minutos}' ${lonSex.segundos}" ${
    lonSex.direccion
  }`;
}

/**
 * Parsea coordenadas desde formato WKT de PostGIS
 */
export function parseWKTPoint(
  wkt: string,
  profundidad: number = 0
): { latitud: number; longitud: number; profundidad: number } | undefined {
  try {
    if (!wkt) {
      console.warn("WKT vacío recibido");
      return undefined;
    }

    // Si el WKT tiene el formato GeoJSON
    if (typeof wkt === "string" && wkt.includes('"type":"Point"')) {
      const geoJSON = JSON.parse(wkt);
      const [lon, lat] = geoJSON.coordinates;
      return { latitud: lat, longitud: lon, profundidad };
    }

    // Si el WKT tiene el formato SRID=4326;POINT(lon lat)
    if (wkt.startsWith("SRID=4326;POINT(")) {
      const coords = wkt.replace("SRID=4326;POINT(", "").replace(")", "");
      const [lon, lat] = coords.split(" ").map(Number);
      return { latitud: lat, longitud: lon, profundidad };
    }

    // Si el WKT tiene el formato POINT(lon lat)
    if (wkt.startsWith("POINT(")) {
      const coords = wkt.replace("POINT(", "").replace(")", "");
      const [lon, lat] = coords.split(" ").map(Number);
      return { latitud: lat, longitud: lon, profundidad };
    }

    // Si el WKT tiene el formato hexadecimal
    if (wkt.includes("E6100000")) {
      const hexPart = wkt.substring(18);
      const lonHex = hexPart.substring(0, 16);
      const latHex = hexPart.substring(16, 32);

      const buf1 = Buffer.from(lonHex, "hex");
      const buf2 = Buffer.from(latHex, "hex");

      const lon = buf1.readDoubleLE(0);
      const lat = buf2.readDoubleLE(0);

      return { latitud: lat, longitud: lon, profundidad };
    }

    console.warn("Formato WKT no reconocido:", wkt);
    return undefined;
  } catch (error) {
    console.error("Error parsing WKT:", error, "for input:", wkt);
    return undefined;
  }
}
