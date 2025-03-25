import { Campania } from "../types/campania";
import { Persona } from "../types/persona";
import { Tables } from "@/lib/types/database.types";

// Extendemos el tipo para incluir el resultado del join con responsable
type CampaniaWithRelations = Tables<"campanias"> & {
  responsable?: {
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  };
  cantidadTransectas?: {
    count: number;
  };
};

export function mapCampania(campania: CampaniaWithRelations): Campania {
  // Si tiene el join con responsable, usamos eso
  // Sino, creamos un objeto vacío con el ID
  let responsable: Persona;

  if (campania.responsable) {
    // Si tenemos el objeto responsable del join, lo usamos directamente
    responsable = {
      id: campania.responsable.id,
      nombre: campania.responsable.nombre,
      apellido: campania.responsable.apellido,
      rol: campania.responsable.rol,
    };
  } else {
    // Si solo tenemos el ID, creamos un objeto con valores por defecto
    responsable = {
      id: campania.responsable_id,
      nombre: "",
      apellido: "",
      rol: "", // Valor por defecto
    };
  }

  return {
    id: campania.id,
    nombre: campania.nombre || "",
    inicio: campania.inicio,
    fin: campania.fin || "",
    observaciones: campania.observaciones || "",
    responsable: responsable,
    cantidadTransectas:
      campania.cantidadTransectas?.count || campania.cant_transectas || 0,
  };
}

export function mapCampanias(campanias: CampaniaWithRelations[]): Campania[] {
  return campanias.map(mapCampania);
}
