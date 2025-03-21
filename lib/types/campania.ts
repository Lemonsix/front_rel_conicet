import { Transecta } from "./transecta";

export interface Campania{
    id: number;
    nombre: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    transectas: Transecta[];
}