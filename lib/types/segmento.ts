import { Cuadrado } from "./cuadrado";
import { Marisqueo } from "./marisqueo";
import { Sustrato } from "./sustrato";
import { Coordenada } from "./coordenadas";

export interface Segmento {
  id: number;
  transectaId: number; // para mantener la relación con transectas clara
  numero: number;
  largo: number; // nullable en DB, por ende opcional
  profundidadInicial?: number;
  profundidadFinal?: number;
  conteo?: number;
  tieneMarisqueo?: boolean; // preferible boolean en lugar de bpchar
  tieneCuadrados?: boolean;
  estMinima: number;
  // IMPORTANTE: estas propiedades deben serializarse antes de pasarse entre componentes server y client
  // Usar serializaCoordenada() de lib/utils/coordinates.ts
  coordenadasInicio?: any; // Versión serializada de Coordenada
  coordenadasFin?: any; // Versión serializada de Coordenada
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
