import { Cuadrado } from "./cuadrado";
import { Marisqueo } from "./marisqueo";
import { Sustrato } from "./sustrato";

export interface Segmento {
  id: number;
  numero: number;
  largo: number;
  profundidadInicial: number;
  profundidadFinal: number;
  conteo: number;
  marisqueos: Marisqueo[];
  cuadrados?: Cuadrado[];
  sustrato: Sustrato;
  waypoints?: Waypoint[];
}

export interface Waypoint {
  id: number;
  latitud: number;
  longitud: number;
  profundidad: number;
}
