import { Persona } from "./persona";
import { Transecta } from "./transecta";

export interface Campania {
  id: number;
  nombre: string;
  observaciones?: string;
  inicio: string;
  fin: string;
  cantidadTransectas?: number;
  responsable: Persona;
  transectas?: Transecta[];
}
