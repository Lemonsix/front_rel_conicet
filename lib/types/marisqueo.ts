import { Persona } from "./persona";
import { Coordenada } from "./coordenadas";

export interface Marisqueo {
  id: number;
  segmentoId?: number;
  timestamp: string;
  tiempo: number;
  coordenadas: Coordenada;
  tieneMuestreo: boolean;
  buzoId?: number;
  buzo?: Persona;
  nCaptura: number;
  pesoMuestra: number;
}
