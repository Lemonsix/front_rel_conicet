// Coordenada sexagesimal para UI
interface SexagesimalCoordinate {
  grados: number;
  minutos: number;
  segundos: number;
  direccion: "N" | "S" | "E" | "W";
}

// Coordenada sexagesimal completa (lat/lon)
interface SexagesimalPosition {
  latitud: SexagesimalCoordinate;
  longitud: SexagesimalCoordinate;
}

// Coordenada decimal para cálculos internos/backend
interface DecimalPosition {
  latitud: number;
  longitud: number;
}
