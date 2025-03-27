// coordenada.ts

type DireccionLatitud = "N" | "S";
type DireccionLongitud = "E" | "O";

export interface SexagesimalCoordinate {
  grados: number;
  minutos: number;
  segundos: number;
  direccion: DireccionLatitud | DireccionLongitud;
}

export interface SexagesimalPosition {
  latitud: SexagesimalCoordinate;
  longitud: SexagesimalCoordinate;
}

export class Coordenada {
  private _latitud: number;
  private _longitud: number;

  private constructor(latitud: number, longitud: number) {
    this._latitud = latitud;
    this._longitud = longitud;
  }

  static fromDecimal(latitud: number, longitud: number): Coordenada {
    return new Coordenada(latitud, longitud);
  }

  static fromSexagesimal(sexagesimal: SexagesimalPosition): Coordenada {
    return new Coordenada(
      Coordenada.sexagesimalToDecimal(sexagesimal.latitud),
      Coordenada.sexagesimalToDecimal(sexagesimal.longitud)
    );
  }

  static fromGeoJSON(geoJSON: string): Coordenada | null {
    try {
      const geoJSONObject = JSON.parse(geoJSON);
      if (geoJSONObject.type !== "Point") return null;
      return new Coordenada(
        geoJSONObject.coordinates[1],
        geoJSONObject.coordinates[0]
      );
    } catch {
      return null;
    }
  }

  static fromWKT(wkt: string): Coordenada | null {
    if (!wkt.startsWith("SRID=4326;POINT")) return null;

    try {
      // Extraer coordenadas del formato "SRID=4326;POINT(longitud latitud)"
      const match = wkt.match(/POINT\(([^ ]+) ([^)]+)\)/);
      if (!match) return null;

      const longitud = parseFloat(match[1]);
      const latitud = parseFloat(match[2]);

      return Coordenada.fromDecimal(latitud, longitud);
    } catch {
      return null;
    }
  }

  static fromWKBHex(wkbHex: string): Coordenada | null {
    if (!/^0101000020E6100000/.test(wkbHex)) return null;

    try {
      const xHex = wkbHex.substring(18, 34);
      const yHex = wkbHex.substring(34, 50);

      const longitud = Coordenada.hexToDouble(xHex);
      const latitud = Coordenada.hexToDouble(yHex);

      return new Coordenada(latitud, longitud);
    } catch {
      return null;
    }
  }

  get decimal(): { latitud: number; longitud: number } {
    return { latitud: this._latitud, longitud: this._longitud };
  }

  get sexagesimal(): SexagesimalPosition {
    return {
      latitud: Coordenada.decimalToSexagesimal(this._latitud, "latitud"),
      longitud: Coordenada.decimalToSexagesimal(this._longitud, "longitud"),
    };
  }

  get wkb(): string {
    return `SRID=4326;POINT(${this._longitud} ${this._latitud})`;
  }

  private static sexagesimalToDecimal(coord: SexagesimalCoordinate): number {
    const sign = coord.direccion === "S" || coord.direccion === "O" ? -1 : 1;
    return sign * (coord.grados + coord.minutos / 60 + coord.segundos / 3600);
  }

  private static decimalToSexagesimal(
    decimal: number,
    tipo: "latitud" | "longitud"
  ): SexagesimalCoordinate {
    const absolute = Math.abs(decimal);
    const grados = Math.floor(absolute);
    const minutosDecimal = (absolute - grados) * 60;
    const minutos = Math.floor(minutosDecimal);
    const segundos = parseFloat(((minutosDecimal - minutos) * 60).toFixed(2));

    const direccion =
      tipo === "latitud"
        ? decimal >= 0
          ? "N"
          : "S"
        : decimal >= 0
        ? "E"
        : "O";

    return { grados, minutos, segundos, direccion };
  }

  private static hexToDouble(hex: string): number {
    const bigEndianHex = hex.match(/../g)?.reverse().join("") || "";

    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    for (let i = 0; i < 8; i++) {
      const byte = parseInt(bigEndianHex.substr(i * 2, 2), 16);
      view.setUint8(i, byte);
    }

    return view.getFloat64(0);
  }
}
