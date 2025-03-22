import { Embarcacion } from "@/lib/types/embarcacion";
import { Segmento } from "@/lib/types/segmento";
import { Persona } from "./persona";

export interface Transecta {
  id: number;
  nombre: string;
  observaciones?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  profundidadInicial: number;
  orientacion: string;
  embarcacionId?: number;
  buzo?: Persona;
  buzoId?: number;
  embarcacion?: Embarcacion;
  campaniaId: number;
  planillero?: Persona;
  planilleroId?: number;
  segmentos?: Segmento[];
}
