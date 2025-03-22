import { CampaniaView } from "@/components/campanias/campania-view";
import { Transecta } from "@/lib/types/transecta";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Campania } from "@/lib/types/campania";
import { Waypoint } from "@/lib/types/segmento";

// Habilitar ISR con revalidación cada 1 hora
export const revalidate = 3600;

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

export default async function CampaniaPage({
  params,
}: {
  params: { campaniaId: string };
}) {
  const supabase = await createClient();

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

      console.log("Parsed coordinates:", { lat, lon, profundidad });
      return { latitud: lat, longitud: lon, profundidad };
    } catch (error) {
      console.error("Error parsing WKT:", error, "for input:", wkt);
      return undefined;
    }
  };

  // Obtener datos de la campaña
  const { data: campaniaData, error: campaniaError } = await supabase
    .from("campanias")
    .select(
      `
      id,
      nombre,
      observaciones,
      inicio,
      fin,
      cantidadTransectas: transectas(count),
      responsable:personas!campanias_fk_responsable_personas(
        id,
        nombre,
        apellido,
        rol
      )
    `
    )
    .eq("id", params.campaniaId)
    .single();

  if (campaniaError) {
    console.error("Error fetching campaña:", campaniaError);
    notFound();
  }

  // Obtener transectas de la campaña
  const { data: transectasData, error: transectasError } = await supabase
    .from("transectas")
    .select(
      `
      id,
      nombre,
      observaciones,
      fecha,
      hora_inicio,
      hora_fin,
      profundidad_inicial,
      orientacion,
      embarcacion_id,
      buzo_id,
      campania_id,
      embarcacion:embarcaciones!transectas_fk_embarcaciones(
        id,
        nombre,
        matricula
      ),
      buzo:personas!transectas_fk_buzo_personas(
        id,
        nombre,
        apellido,
        rol
      ),
      segmentos!inner(
        id,
        numero,
        largo,
        profundidad_inicial,
        profundidad_final,
        sustrato:sustratos!segmentos_fk_sustratos(
          id,
          codigo,
          descripcion
        ),
        conteo,
        est_minima,
        coordenadas_inicio,
        coordenadas_fin,
        tiene_marisqueo,
        tiene_cuadrados,
        marisqueos!marisqueos_fk_segmentos(
          id,
          segmento_id,
          timestamp,
          tiempo,
          coordenadas,
          tiene_muestreo,
          buzo_id,
          n_captura,
          peso_muestra
        ),
        cuadrados(
          id,
          segmento_id,
          replica,
          coordenadas_inicio,
          coordenadas_fin,
          profundidad_inicio,
          profundidad_fin,
          tiene_muestreo,
          conteo,
          tamanio,
          timestamp
        )
      )
    `
    )
    .eq("campania_id", params.campaniaId);

  if (transectasError) {
    console.error("Error fetching transectas:", transectasError);
    notFound();
  }

  console.log(
    "Datos del primer segmento de la primera transecta:",
    JSON.stringify(transectasData?.[0]?.segmentos?.[0], null, 2)
  );

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
        t.segmentos?.map((s) => {
          return {
            id: s.id,
            transectId: t.id,
            numero: s.numero,
            largo: s.largo,
            profundidadInicial: s.profundidad_inicial,
            profundidadFinal: s.profundidad_final,
            sustrato: s.sustrato[0],
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
            marisqueos: s.marisqueos.map((m) => ({
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
            cuadrados: s.cuadrados.map((c) => ({
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
          };
        }) || [],
    })
  );

  // Asignar las transectas a la campaña
  campania.transectas = transectas;

  return <CampaniaView campania={campania} transectas={transectas} />;
}
