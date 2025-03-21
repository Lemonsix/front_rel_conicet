import { Embarcacion } from "@/lib/types/embarcacion";
import { Segmento } from "@/lib/types/segmento";

export interface Transecta{
    id: number;
    nombre: string;
    descripcion: string;
    fecha: Date;
    horaInicio: Date;
    horaFin: Date;
    embarcacion: Embarcacion;
    campaniaId: number;
    segmentos: Segmento[];
}