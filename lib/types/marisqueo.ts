import { Persona } from "./persona";

export interface Marisqueo {
  id: number;
  segmentoId?: number;
  timestamp: string;
  tiempo: number;
  coordenadas: string;
  tieneMuestreo: boolean;
  buzoId?: number;
  buzo?: Persona;
  NroCaptura: number;
  PesoMuestra: number;
}
