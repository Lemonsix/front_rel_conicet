import { Coordenada } from "./coordenadas";

export interface Cuadrado {
  id: number;
  segmentoId: number;
  replica: number;
  coordenadasInicio: Coordenada;
  coordenadasFin: Coordenada;
  profundidadInicio: string;
  profundidadFin: string;
  tieneMuestreo: boolean;
  conteo: number;
  tamanio: number;
  timestamp: string;
}
