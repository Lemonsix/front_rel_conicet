import {
  Coordenada,
  SustratoData,
  MarisqueoData,
  CuadradoData,
  SegmentoData,
} from "../actions/segmentos";

// Función para parsear puntos GeoJSON
export function parseGeoJSONPoint(
  geoJSONString: string | null,
  profundidad: number = 0
) {
  if (!geoJSONString) return undefined;

  try {
    const geoJSON =
      typeof geoJSONString === "string"
        ? JSON.parse(geoJSONString)
        : geoJSONString;

    if (
      geoJSON &&
      geoJSON.type === "Point" &&
      Array.isArray(geoJSON.coordinates)
    ) {
      const [lng, lat] = geoJSON.coordinates;
      return { lat, lng, depth: profundidad };
    }
    return undefined;
  } catch (error) {
    console.error("Error parseando GeoJSON:", error);
    return undefined;
  }
}

// Función para mapear segmentos
export function mapearSegmentos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  segmentosData: any[],
  transectaId: number
): SegmentoData[] {
  if (!segmentosData || !Array.isArray(segmentosData)) {
    console.error("segmentosData no es un array válido:", segmentosData);
    return [];
  }

  return segmentosData.map((s) => {
    if (!s || typeof s !== "object") {
      console.error("Elemento de segmentosData no válido:", s);
      return createDefaultSegmento(transectaId);
    }

    try {
      const rawCoordsInicio = s.coordenadas_inicio
        ? parseGeoJSONPoint(s.coordenadas_inicio, s.profundidad_inicial || 0)
        : undefined;

      const rawCoordsFin = s.coordenadas_fin
        ? parseGeoJSONPoint(s.coordenadas_fin, s.profundidad_final || 0)
        : undefined;

      // Convertir al formato Waypoint requerido
      const coordenadasInicio: Coordenada = rawCoordsInicio
        ? {
            latitud: rawCoordsInicio.lat,
            longitud: rawCoordsInicio.lng,
            profundidad: rawCoordsInicio.depth,
          }
        : {
            latitud: 0,
            longitud: 0,
            profundidad: s.profundidad_inicial || 0,
          };

      const coordenadasFin: Coordenada = rawCoordsFin
        ? {
            latitud: rawCoordsFin.lat,
            longitud: rawCoordsFin.lng,
            profundidad: rawCoordsFin.depth,
          }
        : {
            latitud: 0,
            longitud: 0,
            profundidad: s.profundidad_final || 0,
          };

      // Procesar el sustrato
      let sustrato: SustratoData = { id: 0, codigo: "", descripcion: "" };
      if (Array.isArray(s.sustrato) && s.sustrato.length > 0) {
        sustrato = s.sustrato[0] as SustratoData;
      } else if (
        s.sustrato &&
        typeof s.sustrato === "object" &&
        !Array.isArray(s.sustrato)
      ) {
        sustrato = s.sustrato as SustratoData;
      }

      // Procesar marisqueos
      const marisqueos = procesarMarisqueos(s.marisqueos);

      // Procesar cuadrados
      const cuadrados = procesarCuadrados(s.cuadrados);

      const segmento: SegmentoData = {
        id: s.id,
        transectId: transectaId,
        numero: s.numero || 0,
        largo: s.largo || 0,
        profundidad_inicial: s.profundidad_inicial || 0,
        profundidad_final: s.profundidad_final || 0,
        profundidadInicial: s.profundidad_inicial || 0,
        profundidadFinal: s.profundidad_final || 0,
        sustrato: sustrato,
        conteo: s.conteo || 0,
        est_minima: s.est_minima || 0,
        estMinima: s.est_minima || 0,
        tiene_marisqueo: s.tiene_marisqueo || "",
        tiene_cuadrados: s.tiene_cuadrados || "",
        tieneMarisqueo: s.tiene_marisqueo === "SI",
        tieneCuadrados: s.tiene_cuadrados === "SI",
        coordenadas_inicio: s.coordenadas_inicio || "",
        coordenadas_fin: s.coordenadas_fin || "",
        coordenadasInicio: coordenadasInicio,
        coordenadasFin: coordenadasFin,
        marisqueos,
        cuadrados,
      };

      return segmento;
    } catch (error) {
      console.error("Error procesando segmento:", error);
      return createDefaultSegmento(transectaId);
    }
  });
}

// Función para crear un segmento por defecto
function createDefaultSegmento(transectaId: number): SegmentoData {
  return {
    id: 0,
    transectId: transectaId,
    numero: 0,
    largo: 0,
    profundidad_inicial: 0,
    profundidad_final: 0,
    profundidadInicial: 0,
    profundidadFinal: 0,
    sustrato: { id: 0, codigo: "", descripcion: "" },
    conteo: 0,
    est_minima: 0,
    estMinima: 0,
    tiene_marisqueo: "",
    tiene_cuadrados: "",
    tieneMarisqueo: false,
    tieneCuadrados: false,
    coordenadas_inicio: "",
    coordenadas_fin: "",
    coordenadasInicio: { latitud: 0, longitud: 0, profundidad: 0 },
    coordenadasFin: { latitud: 0, longitud: 0, profundidad: 0 },
    marisqueos: [],
    cuadrados: [],
  };
}

// Función para procesar marisqueos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function procesarMarisqueos(
  marisqueosData: any[] | undefined
): MarisqueoData[] {
  if (!marisqueosData || !Array.isArray(marisqueosData)) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return marisqueosData.map((m: any) => ({
    id: m.id,
    segmento_id: m.segmento_id || 0,
    timestamp: m.timestamp || "",
    tiempo: m.tiempo || 0,
    coordenadas: m.coordenadas || "",
    tiene_muestreo: m.tiene_muestreo || false,
    buzo_id: m.buzo_id || 0,
    n_captura: m.n_captura || 0,
    peso_muestra: m.peso_muestra || 0,
    buzo: m.buzo,
  }));
}

// Función para procesar cuadrados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function procesarCuadrados(cuadradosData: any[] | undefined): CuadradoData[] {
  if (!cuadradosData || !Array.isArray(cuadradosData)) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cuadradosData.map((c: any) => ({
    id: c.id,
    segmento_id: c.segmento_id || 0,
    replica: c.replica || 0,
    coordenadas_inicio: c.coordenadas_inicio || "",
    coordenadas_fin: c.coordenadas_fin || "",
    profundidad_inicio: c.profundidad_inicio || 0,
    profundidad_fin: c.profundidad_fin || 0,
    tiene_muestreo: c.tiene_muestreo || false,
    conteo: c.conteo || 0,
    tamanio: c.tamanio || 0,
    timestamp: c.timestamp || "",
    coordenadasInicio: c.coordenadasInicio,
    coordenadasFin: c.coordenadasFin,
  }));
}
