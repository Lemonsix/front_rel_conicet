import { CampaniaView } from "@/components/campanias/campania-view";
import { Transecta } from "@/lib/types/transecta";
import { notFound } from "next/navigation";
import { Campania } from "@/lib/types/campania";
import { Waypoint } from "@/lib/types/segmento";
import { getCampaniaByIdAction } from "@/lib/actions/campanias";

interface MarisqueoDBData {
  id: number;
  segmento_id: number;
  timestamp: string;
  tiempo: number;
  coordenadas: string;
  tiene_muestreo: boolean;
  buzo_id: number;
  n_captura: number;
  peso_muestra: number;
}

interface CuadradoDBData {
  id: number;
  segmento_id: number;
  replica: number;
  coordenadas_inicio: string;
  coordenadas_fin: string;
  profundidad_inicio: string;
  profundidad_fin: string;
  tiene_muestreo: boolean;
  conteo: number;
  tamanio: number;
  timestamp: string;
}

interface SegmentoDBData {
  id: number;
  numero: number;
  largo: number;
  profundidad_inicial: number;
  profundidad_final: number;
  sustrato_id: number;
  sustrato: Array<{
    id: number;
    codigo: string;
    descripcion: string;
  }>;
  conteo: number;
  est_minima: number;
  coordenadas_inicio: string;
  coordenadas_fin: string;
  tiene_marisqueo: string;
  tiene_cuadrados: string;
  marisqueos: MarisqueoDBData[];
  cuadrados: CuadradoDBData[];
}

interface TransectaDBData {
  id: number;
  nombre: string;
  observaciones?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  profundidad_inicial: number;
  orientacion: string;
  embarcacion_id?: number;
  buzo_id?: number;
  campania_id: number;
  embarcacion: Array<{
    id: number;
    nombre: string;
    matricula: string;
  }>;
  buzo: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }>;
  segmentos?: SegmentoDBData[];
}

interface CampaniaDBData {
  id: number;
  nombre: string;
  observaciones?: string;
  inicio: string;
  fin: string;
  cantidadTransectas: Array<{ count: number }>;
  responsable: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }>;
}

interface CampaniaResponse {
  data: {
    campania: CampaniaDBData;
    transectas: TransectaDBData[];
  };
  error?: string;
}

// Función para parsear coordenadas WKT
const parseWKTPoint = (
  wkt: string,
  profundidad: number
): Waypoint | undefined => {
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
};

export default async function CampaniaPage({
  params,
}: {
  params: Promise<{ campaniaId: string }>;
}) {
  const { campaniaId } = await params;
  const { data, error } = (await getCampaniaByIdAction(
    campaniaId
  )) as CampaniaResponse;

  if (error) {
    console.error("Error fetching campaña:", error);
    notFound();
  }

  const { campania: campaniaData, transectas: transectasData } = data;

  // Mapear los datos a los tipos correctos
  const campania: Campania = {
    id: campaniaData.id,
    nombre: campaniaData.nombre,
    observaciones: campaniaData.observaciones,
    inicio: campaniaData.inicio,
    fin: campaniaData.fin,
    cantidadTransectas: Array.isArray(campaniaData.cantidadTransectas)
      ? campaniaData.cantidadTransectas[0].count
      : 0,
    responsable: Array.isArray(campaniaData.responsable)
      ? campaniaData.responsable[0]
      : campaniaData.responsable,
    transectas: [],
  };

  const transectas: Transecta[] = (transectasData || []).map(
    (t: TransectaDBData) => ({
      id: t.id,
      nombre: t.nombre,
      observaciones: t.observaciones,
      fecha: t.fecha,
      horaInicio: t.hora_inicio,
      horaFin: t.hora_fin,
      profundidadInicial: t.profundidad_inicial,
      orientacion: t.orientacion,
      embarcacionId: t.embarcacion_id,
      buzoId: t.buzo_id,
      campaniaId: t.campania_id,
      embarcacion: t.embarcacion?.[0],
      buzo: t.buzo?.[0],
      segmentos:
        t.segmentos?.map((s: SegmentoDBData) => ({
          id: s.id,
          transectId: t.id,
          numero: s.numero,
          largo: s.largo,
          profundidadInicial: s.profundidad_inicial,
          profundidadFinal: s.profundidad_final,
          sustrato: s.sustrato[0],
          sustratoId: s.sustrato_id,
          conteo: s.conteo,
          estMinima: s.est_minima || 0,
          tieneMarisqueo: s.tiene_marisqueo === "SI",
          tieneCuadrados: s.tiene_cuadrados === "SI",
          coordenadasInicio: s.coordenadas_inicio
            ? parseWKTPoint(s.coordenadas_inicio, s.profundidad_inicial)
            : undefined,
          coordenadasFin: s.coordenadas_fin
            ? parseWKTPoint(s.coordenadas_fin, s.profundidad_final)
            : undefined,
          marisqueos: s.marisqueos.map((m: MarisqueoDBData) => ({
            id: m.id,
            segmentoId: m.segmento_id,
            timestamp: m.timestamp,
            tiempo: m.tiempo,
            coordenadas: m.coordenadas,
            tieneMuestreo: m.tiene_muestreo,
            buzoId: m.buzo_id,
            NroCaptura: m.n_captura,
            PesoMuestra: m.peso_muestra,
          })),
          cuadrados: s.cuadrados.map((c: CuadradoDBData) => ({
            id: c.id,
            segmentoId: c.segmento_id,
            replica: c.replica,
            coordenadasInicio: c.coordenadas_inicio,
            coordenadasFin: c.coordenadas_fin,
            profundidadInicio: c.profundidad_inicio,
            profundidadFin: c.profundidad_fin,
            tieneMuestreo: c.tiene_muestreo,
            conteo: c.conteo,
            tamanio: c.tamanio,
            timestamp: c.timestamp,
          })),
        })) || [],
    })
  );

  // Asignar las transectas a la campaña
  campania.transectas = transectas;

  return <CampaniaView campania={campania} transectas={transectas} />;
}
