export function parseGeoJSONPoint(geoJsonStr: string, depth?: number) {
  try {
    const geoJson = JSON.parse(geoJsonStr);
    if (
      geoJson &&
      geoJson.type === "Point" &&
      Array.isArray(geoJson.coordinates)
    ) {
      return {
        lng: geoJson.coordinates[0],
        lat: geoJson.coordinates[1],
        depth,
      };
    }
  } catch (error) {
    console.error("Error parseando GeoJSON:", error);
  }
  return undefined;
}

// Función para calcular la distancia entre dos puntos en metros usando la fórmula de Haversine
export async function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

// Función para convertir decimal a formato sexagesimal (grados, minutos, segundos)
export function decimalToSexagesimal(decimal: number): {
  grados: number;
  minutos: number;
  segundos: number;
  direccion: string;
} {
  const absolute = Math.abs(decimal);
  const grados = Math.floor(absolute);
  const minutesNotTruncated = (absolute - grados) * 60;
  const minutos = Math.floor(minutesNotTruncated);
  const segundos = Math.round((minutesNotTruncated - minutos) * 60 * 100) / 100;

  // Dirección N/S para latitud, E/W para longitud
  const direccion =
    decimal >= 0
      ? Math.abs(grados) > 90
        ? "E"
        : "N"
      : Math.abs(grados) > 90
      ? "W"
      : "S";

  return { grados, minutos, segundos, direccion };
}

// Función auxiliar para convertir WKT Hex a GeoJSON
export function wktHexToGeoJSON(wkt: string): string | null {
  console.log("wkt a procesar:", wkt);
  if (!wkt) return null;

  try {
    if (wkt.startsWith("0101000020E6100000")) {
      const hexPart = wkt.substring(18);
      const lonHex = hexPart.substring(0, 16);
      const latHex = hexPart.substring(16, 32);

      const lon = Buffer.from(lonHex, "hex").readDoubleLE(0);
      const lat = Buffer.from(latHex, "hex").readDoubleLE(0);

      return JSON.stringify({ type: "Point", coordinates: [lon, lat] });
    }

    // Añadir soporte a WKT clásico
    if (wkt.startsWith("SRID=4326;POINT(")) {
      const coords = wkt.match(/POINT\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
      if (coords) {
        const lon = parseFloat(coords[1]);
        const lat = parseFloat(coords[2]);
        return JSON.stringify({ type: "Point", coordinates: [lon, lat] });
      }
    }

    console.warn("Formato WKT no reconocido:", wkt);
    return null;
  } catch (error) {
    console.error("Error convirtiendo WKT a GeoJSON:", error);
    return null;
  }
}
