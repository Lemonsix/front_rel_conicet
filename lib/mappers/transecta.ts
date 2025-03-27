import { Embarcacion } from "../types/embarcacion";
import { Persona } from "../types/persona";
import { Transecta } from "../types/transecta";
import { mapSegmento } from "./segmentos";

// Tipo extendido para representar el resultado del join complejo
type TransectaWithRelations = {
  id: number;
  nombre: string | null;
  observaciones: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  profundidad_inicial: number | null;
  orientacion: string | null;
  embarcacion_id: number | null;
  buzo_id: number | null;
  campania_id: number;
  embarcacion?: {
    id: number;
    nombre: string;
    matricula: string | null;
  }[];
  buzo?: {
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }[];
  segmentos?: any[];
};

export function mapTransecta(transecta: TransectaWithRelations): Transecta {
  // Mapear el objeto embarcacion si existe
  let embarcacion: Embarcacion | undefined;
  if (transecta.embarcacion && transecta.embarcacion.length > 0) {
    embarcacion = {
      id: transecta.embarcacion[0].id,
      nombre: transecta.embarcacion[0].nombre,
      matricula: transecta.embarcacion[0].matricula || "",
    };
  }

  // Mapear el objeto buzo si existe
  let buzo: Persona | undefined;
  if (transecta.buzo && transecta.buzo.length > 0) {
    buzo = {
      id: transecta.buzo[0].id,
      nombre: transecta.buzo[0].nombre,
      apellido: transecta.buzo[0].apellido,
      rol: transecta.buzo[0].rol,
    };
  }

  return {
    id: transecta.id,
    nombre: transecta.nombre || "",
    observaciones: transecta.observaciones || "",
    fecha: transecta.fecha,
    horaInicio: transecta.hora_inicio || "",
    horaFin: transecta.hora_fin || "",
    // Tratar null como 0 para profundidadInicial
    profundidadInicial: transecta.profundidad_inicial || 0,
    orientacion: transecta.orientacion || "",
    embarcacionId: transecta.embarcacion_id || undefined,
    buzoId: transecta.buzo_id || undefined,
    campaniaId: transecta.campania_id,
    embarcacion: embarcacion,
    buzo: buzo,
    segmentos: transecta.segmentos ? transecta.segmentos.map(mapSegmento) : [],
  };
}

export function mapTransectas(
  transectas: TransectaWithRelations[]
): Transecta[] {
  return transectas.map(mapTransecta);
}
