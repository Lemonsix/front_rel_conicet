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
  muestreos: MuestreoCuadrado[];
}


export type MuestreoCuadrado = {
  id: number;
  cuadrado_id: number;
  talla: number | null;
  peso_tot: number | null;
  peso_val: number | null;
  peso_callo: number | null;
};