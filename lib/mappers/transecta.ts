import { Coordenada } from "../types/coordenadas";
import { Embarcacion } from "../types/embarcacion";
import { Persona } from "../types/persona";
import { Transecta } from "../types/transecta";
import { mapSegmento } from "./segmentos";
import { aseguraCoordenada, serializaCoordenada } from "../utils/coordinates";

// Tipo extendido para representar el resultado del join complejo
export type TransectaWithRelations = {
  id: number;
  nombre: string | null;
  observaciones: string | null;
  fecha: string;
  cantidad_segmentos?: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  profundidad_inicial: number | null;
  profundidad_final: number | null;
  orientacion: string | null;
  embarcacion_id: number | null;
  buzo_id: number | null;
  campania_id: number;
  coordenadas_inicio: any | null;
  coordenadas_fin: any | null;
  embarcacion?: {
    id: number;
    nombre: string;
    matricula: string | null;
  } | null;
  buzo?: {
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  } | null;
  segmentos?: any[];
};

export function mapTransecta(transecta: TransectaWithRelations): Transecta {
  // Mapear el objeto embarcacion si existe
  let embarcacion: Embarcacion | undefined;
  if (transecta.embarcacion) {
    embarcacion = {
      id: transecta.embarcacion.id,
      nombre: transecta.embarcacion.nombre,
      matricula: transecta.embarcacion.matricula || "",
    };
  }

  // Mapear el objeto buzo si existe
  let buzo: Persona | undefined;
  if (transecta.buzo) {
    buzo = {
      id: transecta.buzo.id,
      nombre: transecta.buzo.nombre,
      apellido: transecta.buzo.apellido,
      rol: transecta.buzo.rol,
    };
  }

  // Si hay segmentos disponibles, podemos intentar obtener las coordenadas del primer y último segmento
  let primerSegmento, ultimoSegmento;
  if (transecta.segmentos && transecta.segmentos.length > 0) {
    const segmentosOrdenados = [...transecta.segmentos].sort(
      (a, b) => a.numero - b.numero
    );
    primerSegmento = segmentosOrdenados[0];
    ultimoSegmento = segmentosOrdenados[segmentosOrdenados.length - 1];

    // Si no hay coordenadas en la transecta, pero sí en los segmentos, usamos esas
    if (
      !transecta.coordenadas_inicio &&
      primerSegmento &&
      primerSegmento.coordenadasInicio
    ) {
      transecta.coordenadas_inicio = primerSegmento.coordenadasInicio;
    }

    if (
      !transecta.coordenadas_fin &&
      ultimoSegmento &&
      ultimoSegmento.coordenadasFin
    ) {
      transecta.coordenadas_fin = ultimoSegmento.coordenadasFin;
    }
  }

  // Usar la utilidad aseguraCoordenada para manejar cualquier formato
  let puntoInicio: any = undefined;
  if (transecta.coordenadas_inicio) {
    try {
      const coordenadaInicio = aseguraCoordenada(transecta.coordenadas_inicio);
      puntoInicio = serializaCoordenada(coordenadaInicio);
    } catch (error) {
      console.error("Error al procesar coordenada de inicio:", error);
    }
  } else {
    console.warn("No hay coordenada de inicio disponible");
  }

  // Hacer lo mismo para las coordenadas de fin
  let puntoFin: any = undefined;
  if (transecta.coordenadas_fin) {
    try {
      const coordenadaFin = aseguraCoordenada(transecta.coordenadas_fin);
      puntoFin = serializaCoordenada(coordenadaFin);
    } catch (error) {
      console.error("Error al procesar coordenada de fin:", error);
    }
  } else {
    console.warn("No hay coordenada de fin disponible");
  }

  // Determinar profundidad inicial y final
  // Si no hay profundidad inicial en la transecta pero sí en el primer segmento, usamos esa
  let profundidadInicial =
    transecta.profundidad_inicial !== null &&
    transecta.profundidad_inicial !== undefined
      ? transecta.profundidad_inicial
      : primerSegmento && primerSegmento.profundidadInicial !== undefined
      ? primerSegmento.profundidadInicial
      : undefined;

  // Si no hay profundidad final pero sí en el último segmento, usamos esa
  let profundidadFinal =
    transecta.profundidad_final !== null &&
    transecta.profundidad_final !== undefined
      ? transecta.profundidad_final
      : ultimoSegmento && ultimoSegmento.profundidadFinal !== undefined
      ? ultimoSegmento.profundidadFinal
      : undefined;

  // Mapear los segmentos con el mapper correspondiente
  const segmentos = transecta.segmentos
    ? transecta.segmentos.map(mapSegmento)
    : [];

  // Armar el objeto de transecta
  const transectaMapeada: Transecta = {
    id: transecta.id,
    nombre: transecta.nombre || "",
    observaciones: transecta.observaciones || "",
    fecha: transecta.fecha,
    horaInicio: transecta.hora_inicio || "",
    horaFin: transecta.hora_fin || "",
    profundidadInicial,
    profundidadFinal,
    puntoInicio,
    puntoFin,
    orientacion: transecta.orientacion || "",
    embarcacionId: transecta.embarcacion_id || undefined,
    buzoId: transecta.buzo_id || undefined,
    campaniaId: transecta.campania_id,
    embarcacion,
    buzo,
    segmentos: segmentos, // Garantizamos que nunca es undefined
  };

  return transectaMapeada;
}

export function mapTransectas(
  transectas: TransectaWithRelations[]
): Transecta[] {
  return transectas.map(mapTransecta);
}
