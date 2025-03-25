import { Sustrato } from "../types/sustrato";
import { Tables } from "@/lib/types/database.types";

export function mapSustrato(sustratoDb: Tables<"sustratos">): Sustrato {
  return {
    id: sustratoDb.id,
    codigo: sustratoDb.codigo || "",
    descripcion: sustratoDb.descripcion || "",
  };
}
