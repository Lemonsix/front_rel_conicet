export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Segmento {
  id: number;
  nombre: string;
  puntoInicio: Coordenada;
  puntoFin: Coordenada;
  distancia: number;
  profundidad: number;
}

export interface Transecta {
  id: number;
  nombre: string;
  fecha: string;
  embarcacionId: number;
  segmentos: Segmento[];
} 