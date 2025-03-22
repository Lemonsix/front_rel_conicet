/**
 * Convierte grados decimales a formato sexagesimal (grados, minutos, segundos)
 */
export function decimalToSexagesimal(decimal: number): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

  const direction = decimal >= 0 ? "" : "-";
  return `${direction}${degrees}° ${minutes}' ${seconds}"`;
}

/**
 * Convierte formato sexagesimal (grados, minutos, segundos) a grados decimales
 * Acepta formatos como: "41° 24' 12.2"" o "-41° 24' 12.2""
 */
export function sexagesimalToDecimal(sexagesimal: string): number {
  const match = sexagesimal.match(/(-?)(\d+)°\s*(\d+)'\s*(\d+\.?\d*)"/);
  if (!match) throw new Error("Formato inválido. Use: DD° MM' SS.SS\"");

  const [_, sign, degrees, minutes, seconds] = match;
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
  const latStr = decimalToSexagesimal(lat);
  const lonStr = decimalToSexagesimal(lon);
  return `${latStr} ${lon >= 0 ? "E" : "W"}, ${lonStr} ${lat >= 0 ? "N" : "S"}`;
}

/**
 * Parsea coordenadas desde formato WKT de PostGIS
 */
export function parseWKTPoint(
  wkt: string,
  profundidad: number = 0
): { latitud: number; longitud: number; profundidad: number } | undefined {
  try {
    // Extraer la parte hexadecimal después del SRID
    const hexPart = wkt.substring(18); // Saltamos '0101000020E6100000'

    // Dividir en dos partes de 16 caracteres (8 bytes cada una)
    const lonHex = hexPart.substring(0, 16);
    const latHex = hexPart.substring(16, 32);

    // Convertir de hex a buffer y luego a float64
    const buf1 = Buffer.from(lonHex, "hex");
    const buf2 = Buffer.from(latHex, "hex");

    // Leer como double little-endian
    const lon = buf1.readDoubleLE(0);
    const lat = buf2.readDoubleLE(0);

    return { latitud: lat, longitud: lon, profundidad };
  } catch (error) {
    console.error("Error parsing WKT:", error, "for input:", wkt);
    return undefined;
  }
}
