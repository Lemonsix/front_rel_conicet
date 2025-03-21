import { Marisqueo } from "./marisqueo";
import { Quadrat } from "./quadrat";

export interface Segmento{
    id: number;
    nombre: string;
    descripcion: string;
    campaniaId: number;
    marisqueos: Marisqueo[];
    quadrats: Quadrat[];
    waypoints: Waypoint[];
}   

export interface Waypoint{
    id: number;
    latitud: number;
    longitud: number;
    profundidad: number;
}