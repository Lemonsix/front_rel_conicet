import { Campania } from "../types/campania";
import { Persona } from "../types/persona";
import { Tables } from "@/lib/types/database.types";
import { Transecta } from "../types/transecta";
import { aseguraCoordenada, serializaCoordenada } from "../utils/coordinates";
import { safeGetTime, safeGetDate } from "../utils/datetime";
import { Coordenada } from "../types/coordenadas";
import { fromTheme } from "tailwind-merge";

// Extendemos el tipo para incluir el resultado del join con responsable
type CampaniaWithRelations = Tables<"campanias"> & {
  responsable?:
    | {
        id: number;
        nombre: string;
        apellido: string;
        rol: string;
      }
    | any;
  cantidadTransectas?:
    | {
        count: number;
      }
    | any;
};

// Tipo más flexible para manejar las diferentes estructuras de Supabase
type CampaniaWithTransectas = {
  id: number;
  nombre?: string | null;
  observaciones?: string | null;
  inicio: string;
  fin?: string | null;
  responsable_id?: number;
  // Campos opcionales para acomodar diferentes formatos
  [key: string]: any;
};

// Función para mapear transectas con sus segmentos primero y último
function mapTransectaWithSegments(transecta: any): Transecta {
  if (!transecta || typeof transecta !== "object") {
    console.error("Se recibió un valor de transecta inválido:", transecta);
    // Devolver un objeto Transecta con valores mínimos para evitar errores
    return {
      id: 0,
      nombre: "",
      fecha: "",
      horaInicio: "",
      horaFin: "",
      sentido: "",
    };
  }

  // Mapear buzo si existe
  const buzo: Persona | undefined = transecta.buzo
    ? {
        id: transecta.buzo.id,
        nombre: transecta.buzo.nombre,
        apellido: transecta.buzo.apellido,
        rol: transecta.buzo.rol,
      }
    : undefined;

  // Mapear embarcación si existe
  const embarcacion = transecta.embarcacion
    ? {
        id: transecta.embarcacion.id,
        nombre: transecta.embarcacion.nombre,
        matricula: transecta.embarcacion.matricula || "",
      }
    : undefined;

  // Procesar coordenadas de inicio desde el primer segmento (si existe)
  let puntoInicio;
  if (transecta.firstSegment?.coordenadas_inicio) {
    try {
      // Si las coordenadas empiezan con '0101000020E6100000', son WKB hex
      const coordStr = transecta.firstSegment.coordenadas_inicio;
      if (
        typeof coordStr === "string" &&
        coordStr.startsWith("0101000020E6100000")
      ) {
        const coordenadaInicio = Coordenada.fromWKBHex(coordStr);
        if (coordenadaInicio) {
          puntoInicio = serializaCoordenada(coordenadaInicio);
        } else {
          console.error(
            `Error: No se pudo convertir la coordenada WKB para transecta ${transecta.id}`
          );
        }
      } else {
        // Intentar con el método general
        const coordenadaInicio = aseguraCoordenada(coordStr);
        puntoInicio = serializaCoordenada(coordenadaInicio);
      }
    } catch (error) {
      console.error(
        `Error al procesar coordenada de inicio para transecta ${transecta.id}:`,
        error
      );
    }
  }

  // Procesar coordenadas de fin desde el último segmento (si existe)
  let puntoFin;
  if (transecta.lastSegment?.coordenadas_fin) {
    try {
      // Si las coordenadas empiezan con '0101000020E6100000', son WKB hex
      const coordStr = transecta.lastSegment.coordenadas_fin;
      if (
        typeof coordStr === "string" &&
        coordStr.startsWith("0101000020E6100000")
      ) {
        const coordenadaFin = Coordenada.fromWKBHex(coordStr);
        if (coordenadaFin) {
          puntoFin = serializaCoordenada(coordenadaFin);
        } else {
          console.error(
            `Error: No se pudo convertir la coordenada WKB para transecta ${transecta.id}`
          );
        }
      } else {
        // Intentar con el método general
        const coordenadaFin = aseguraCoordenada(coordStr);
        puntoFin = serializaCoordenada(coordenadaFin);
      }
    } catch (error) {
      console.error(
        `Error al procesar coordenada de fin para transecta ${transecta.id}:`,
        error
      );
    }
  }

  // Obtener profundidades desde los segmentos si están disponibles
  const profundidadInicial = transecta.firstSegment?.profundidad_inicial;
  const profundidadFinal = transecta.lastSegment?.profundidad_final;

  // Para depuración
  if (!puntoInicio && !puntoFin) {
    console.log(
      `AVISO: La transecta ${transecta.id} no tiene coordenadas de inicio ni fin disponibles.`
    );
  }

  const result = {
    id: transecta.id || 0,
    nombre: transecta.nombre || "",
    observaciones: transecta.observaciones || "",
    fecha: safeGetDate(transecta.fecha) || transecta.fecha,
    horaInicio: safeGetTime(transecta.hora_inicio),
    horaFin: safeGetTime(transecta.hora_fin),
    profundidadInicial,
    profundidadFinal,
    puntoInicio,
    puntoFin,
    sentido: transecta.sentido || "",
    embarcacionId: transecta.embarcacion_id,
    buzoId: transecta.buzo_id,
    campaniaId: transecta.campania_id || 0,
    embarcacion,
    buzo,
  };

  return result;
}

export function mapCampania(
  campania: CampaniaWithRelations | CampaniaWithTransectas
): Campania {
  // Si tiene el join con responsable, usamos eso
  // Sino, creamos un objeto vacío con el ID
  let responsable: Persona;

  if (campania.responsable) {
    // Si tenemos el objeto responsable del join, lo usamos directamente
    // Manejar tanto el caso de objeto simple como de array (como puede venir de Supabase)
    const respData = Array.isArray(campania.responsable)
      ? campania.responsable[0]
      : campania.responsable;

    responsable = {
      id: respData.id,
      nombre: respData.nombre,
      apellido: respData.apellido,
      rol: respData.rol,
    };
  } else {
    // Si solo tenemos el ID, creamos un objeto con valores por defecto
    responsable = {
      id: campania.responsable_id || 0,
      nombre: "",
      apellido: "",
      rol: "", // Valor por defecto
    };
  }

  // Manejar el campo cantidadTransectas que puede venir en diferentes formatos
  let cantidadTransectas = undefined;
  if (campania.cantidadTransectas) {
    if (Array.isArray(campania.cantidadTransectas)) {
      cantidadTransectas = campania.cantidadTransectas[0]?.count || 0;
    } else if (typeof campania.cantidadTransectas === "object") {
      cantidadTransectas = campania.cantidadTransectas.count || 0;
    } else if (typeof campania.cantidadTransectas === "number") {
      cantidadTransectas = campania.cantidadTransectas;
    }
  } else if (
    campania.cant_transectas !== undefined &&
    campania.cant_transectas !== null
  ) {
    cantidadTransectas = campania.cant_transectas;
  }

  const result: Campania = {
    id: campania.id,
    nombre: campania.nombre || "",
    inicio: campania.inicio,
    fin: campania.fin || "",
    observaciones: campania.observaciones || "",
    responsable: responsable,
    cantidadTransectas: cantidadTransectas,
  };

  // Si hay transectas, las mapeamos y añadimos al resultado
  if ("transectas" in campania && campania.transectas) {
    // Manejar tanto el caso de array como de objeto (dependiendo del formato de Supabase)
    const transectasData = Array.isArray(campania.transectas)
      ? campania.transectas
      : [campania.transectas];

    result.transectas = transectasData.map(mapTransectaWithSegments);
  }

  return result;
}

// Función helper para mapear la estructura específica que devuelve getCampaniaByIdAction
export function mapCampaniaWithTransectas(data: {
  campania: any;
  transectas: any[];
}): Campania {
  const mappedCampania = mapCampania(data.campania);

  // Si hay transectas en el formato especial, las mapeamos
  if (data.transectas && Array.isArray(data.transectas)) {
    mappedCampania.transectas = data.transectas.map(mapTransectaWithSegments);
  }

  return mappedCampania;
}

export function mapCampanias(campanias: CampaniaWithRelations[]): Campania[] {
  return campanias.map(mapCampania);
}
