import { Cuadrado } from "./cuadrado";
import { Marisqueo } from "./marisqueo";
import { Sustrato } from "./sustrato";

export interface Segmento {
  id: number;
  transectId: number; // para mantener la relación con transectas clara
  numero: number;
  largo: number; // nullable en DB, por ende opcional
  profundidadInicial?: number;
  profundidadFinal?: number;
  conteo?: number;
  tieneMarisqueo?: boolean; // preferible boolean en lugar de bpchar
  tieneCuadrados?: boolean;
  estMinima: number;
  coordenadasInicio?: Waypoint;
  coordenadasFin?: Waypoint;
  marisqueos?: Marisqueo[];
  cuadrados?: Cuadrado[];
  sustrato?: Sustrato;
  sustratoId?: number;
  distancia?: number;
}

export interface Waypoint {
  latitud: number;
  longitud: number;
  profundidad?: number;
}
