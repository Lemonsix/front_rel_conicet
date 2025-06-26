// Tipos para el dominio de marisqueos
export interface TallaMarisqueo {
  marisqueo_id: number;
  talla: number;
  frecuencia: number;
}

// Definir la estructura de un Marisqueo con tallas opcionales
export interface Marisqueo {
  id: number;
  segmento_id: number;
  transecta_id: number;
  buzo_id: number;
  nombre_transecta: string;
  nombre_buzo?: string;
  numero_segmento: number;
  fecha: string;
  n_captura: number;
  profundidad?: number | null;
  tiempo?: number | null;
  peso_muestra?: number | null;
  tiene_muestreo?: boolean | null;
  observaciones?: string;
  tallas?: TallaMarisqueo[];
}
