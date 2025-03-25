// types.ts
export interface SexagesimalCoordinate {
  grados: number;
  minutos: number;
  segundos: number;
  direccion: "N" | "S" | "E" | "W";
}

export interface SexagesimalPosition {
  latitud: SexagesimalCoordinate;
  longitud: SexagesimalCoordinate;
}

export interface DecimalPosition {
  latitud: number;
  longitud: number;
}

export interface Coordenada {
  latitud: number;
  longitud: number;
  profundidad?: number;
}

// conversions.ts

export const sexagesimalToDecimal = (coord: SexagesimalCoordinate): number => {
  const sign = coord.direccion === "S" || coord.direccion === "W" ? -1 : 1;
  return sign * (coord.grados + coord.minutos / 60 + coord.segundos / 3600);
};

export const decimalToSexagesimal = (
  decimal: number,
  tipo: "latitud" | "longitud"
): SexagesimalCoordinate => {
  const absolute = Math.abs(decimal);
  const grados = Math.floor(absolute);
  const minutesNotTruncated = (absolute - grados) * 60;
  const minutos = Math.floor(minutesNotTruncated);
  const segundos = Math.round((minutesNotTruncated - minutos) * 60 * 100) / 100;

  const direccion =
    tipo === "latitud" ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W";

  return { grados, minutos, segundos, direccion };
};

export const positionSexagesimalToDecimal = (
  pos: SexagesimalPosition
): DecimalPosition => ({
  latitud: sexagesimalToDecimal(pos.latitud),
  longitud: sexagesimalToDecimal(pos.longitud),
});

export const positionDecimalToSexagesimal = (
  pos: DecimalPosition
): SexagesimalPosition => ({
  latitud: decimalToSexagesimal(pos.latitud, "latitud"),
  longitud: decimalToSexagesimal(pos.longitud, "longitud"),
});

export const decimalPositionToWKT = (pos: DecimalPosition): string =>
  `SRID=4326;POINT(${pos.longitud} ${pos.latitud})`;

export const parseWKTToDecimalPosition = (
  wkt: string
): DecimalPosition | null => {
  const match = wkt.match(/POINT\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
  if (!match) return null;

  return {
    longitud: parseFloat(match[1]),
    latitud: parseFloat(match[2]),
  };
};

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

export function formatCoordinates(lat: number, lon: number): string {
  if (lat === 0 && lon === 0) return "Sin coordenadas";

  try {
    // Si solo tenemos una coordenada, solo formateamos esa
    if (lat === 0) {
      const lonSex = decimalToSexagesimal(lon, "longitud");
      const lonSeconds = lonSex.segundos.toFixed(2);
      return `${Math.abs(lonSex.grados)}° ${lonSex.minutos}' ${lonSeconds}" ${
        lonSex.direccion
      }`;
    }

    if (lon === 0) {
      const latSex = decimalToSexagesimal(lat, "latitud");
      const latSeconds = latSex.segundos.toFixed(2);
      return `${Math.abs(latSex.grados)}° ${latSex.minutos}' ${latSeconds}" ${
        latSex.direccion
      }`;
    }

    // Si tenemos ambas coordenadas, formateamos ambas
    const latSex = decimalToSexagesimal(lat, "latitud");
    const lonSex = decimalToSexagesimal(lon, "longitud");

    // Formatear con 2 decimales para los segundos
    const latSeconds = latSex.segundos.toFixed(2);
    const lonSeconds = lonSex.segundos.toFixed(2);

    return `${Math.abs(latSex.grados)}° ${latSex.minutos}' ${latSeconds}" ${
      latSex.direccion
    }, ${Math.abs(lonSex.grados)}° ${lonSex.minutos}' ${lonSeconds}" ${
      lonSex.direccion
    }`;
  } catch (error) {
    console.error("Error formateando coordenadas:", error, { lat, lon });
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
}

export function parseWKTToCoordinates(
  wktString: string | null,
  profundidad: number = 0
): Coordenada | null {
  if (!wktString || wktString.trim() === "") return null;

  // Intentamos diferentes patrones de coincidencia
  // 1. Patrón estándar WKT: POINT(lon lat)
  let match = wktString.match(/POINT\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);

  // 2. Si no coincide, intentamos el patrón con SRID: SRID=4326;POINT(lon lat)
  if (!match) {
    match = wktString.match(/SRID=\d+;POINT\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
  }

  // 3. Último intento: buscar cualquier par de coordenadas en el formato (lon lat)
  if (!match) {
    match = wktString.match(/\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
  }

  if (!match) {
    console.warn("No se pudo parsear el formato WKT:", wktString);
    return null;
  }

  const result = {
    longitud: parseFloat(match[1]),
    latitud: parseFloat(match[2]),
    profundidad,
  };

  return result;
}

export function parseGeoJSONToCoordinates(
  geoJSONString: string | null,
  profundidad: number = 0
): Coordenada | null {
  if (!geoJSONString || geoJSONString.trim() === "") return null;

  try {
    // Si es un string JSON, intentamos parsearlo
    if (
      geoJSONString.includes('"type":"Point"') ||
      geoJSONString.includes('"type": "Point"')
    ) {
      const parsed = parseGeoJSONPoint(geoJSONString, profundidad);

      if (parsed) {
        return {
          latitud: parsed.lat,
          longitud: parsed.lng,
          profundidad: parsed.depth,
        };
      }
    }

    // Si no es un GeoJSON válido, intentamos como última opción si tiene algún formato de coordenadas
    // Esto es por si acaso el string contiene coordenadas pero no en formato GeoJSON
    const coordPattern = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/;
    const match = geoJSONString.match(coordPattern);

    if (match) {
      const result = {
        // En este caso asumimos que es lat,lng (a diferencia de WKT que es lng,lat)
        latitud: parseFloat(match[1]),
        longitud: parseFloat(match[2]),
        profundidad,
      };

      return result;
    }

    console.warn("No se pudo parsear el GeoJSON:", geoJSONString);
    return null;
  } catch (error) {
    console.error("Error al parsear GeoJSON:", error);
    return null;
  }
}

// Función para parsear un punto en formato GeoJSON
export function parseGeoJSONPoint(
  geoJSONString: string,
  profundidad: number = 0
): { lat: number; lng: number; depth: number } | null {
  try {
    // Intentar parsear el JSON
    const geoJSON = JSON.parse(geoJSONString);

    // Verificar que es un punto
    if (
      geoJSON.type !== "Point" ||
      !Array.isArray(geoJSON.coordinates) ||
      geoJSON.coordinates.length < 2
    ) {
      console.error("No es un punto GeoJSON válido:", geoJSONString);
      return null;
    }

    // En GeoJSON, el formato es [longitud, latitud]
    const [lng, lat] = geoJSON.coordinates;

    return {
      lat: lat,
      lng: lng,
      depth: profundidad,
    };
  } catch (error) {
    console.error("Error al parsear GeoJSON:", error, geoJSONString);
    return null;
  }
}

// Función para convertir formato WKT hexadecimal a GeoJSON
export function wktHexToGeoJSON(wktHex: string): string | null {
  // Si ya es un GeoJSON, devolverlo tal cual
  if (wktHex.includes('"type":"Point"')) return wktHex;

  // Intentar parsear como WKT
  const point = parseWKTToDecimalPosition(wktHex);
  if (!point) return null;

  // Convertir a formato GeoJSON
  return JSON.stringify({
    type: "Point",
    coordinates: [point.longitud, point.latitud],
  });
}

// Función para parsear coordenadas en formato WKB hexadecimal (PostGIS)
export function parseWKBHex(wkbHex: string): Coordenada | null {
  // Verificar si es un formato hexadecimal de PostGIS
  if (!/^0101000020E6100000/.test(wkbHex)) {
    console.warn("No parece ser un formato WKB hexadecimal válido:", wkbHex);
    return null;
  }

  try {
    // El formato WKB hex para POINT en PostGIS es:
    // 0101000020E6100000 + 8 bytes para X + 8 bytes para Y en little endian
    // Comenzamos en el byte 18 (después del encabezado)
    const xHex = wkbHex.substr(18, 16); // 8 bytes (16 caracteres hex) para X
    const yHex = wkbHex.substr(34, 16); // 8 bytes (16 caracteres hex) para Y

    // Convertir de hex a IEEE 754 double (64 bits)
    const xDouble = hexToDouble(xHex);
    const yDouble = hexToDouble(yHex);

    return {
      longitud: xDouble,
      latitud: yDouble,
      profundidad: undefined,
    };
  } catch (error) {
    console.error("Error parseando WKB hexadecimal:", error);
    return null;
  }
}

// Función auxiliar para convertir hex a double
function hexToDouble(hex: string): number {
  // Reorganizar bytes para convertir de little endian a big endian
  const bigEndianHex = hex.match(/../g)?.reverse().join("") || "";

  // Convertir hex a ArrayBuffer
  const buffer = new ArrayBuffer(8); // 8 bytes = 64 bits
  const view = new DataView(buffer);

  // Llenar el buffer con los bytes del hex
  for (let i = 0; i < 8; i++) {
    const byte = parseInt(bigEndianHex.substr(i * 2, 2), 16);
    view.setUint8(i, byte);
  }

  // Leer como double (float64)
  return view.getFloat64(0);
}
