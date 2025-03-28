import { Embarcacion } from "@/lib/types/embarcacion";
import { Segmento } from "@/lib/types/segmento";
import { Persona } from "./persona";
import { Coordenada } from "./coordenadas";

export interface Transecta {
  id: number;
  nombre: string;
  observaciones?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  profundidadInicial?: number;
  profundidadFinal?: number;
  puntoInicio?: Coordenada;
  puntoFin?: Coordenada;
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
