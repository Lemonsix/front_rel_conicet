import { Embarcacion } from "@/lib/types/embarcacion";
import { Tables } from "@/lib/types/database.types";

export function mapEmbarcacion(
  dbEmbarcacion: Tables<"embarcaciones">
): Embarcacion {
  return {
    id: dbEmbarcacion.id,
    nombre: dbEmbarcacion.nombre,
    matricula: dbEmbarcacion.matricula || "",
  };
}

export function mapEmbarcaciones(
  dbEmbarcaciones: Tables<"embarcaciones">[]
): Embarcacion[] {
  return dbEmbarcaciones.map(mapEmbarcacion);
}
