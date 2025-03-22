"use client";

import { Segmento } from "@/lib/types/segmento";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
} from "react-leaflet";
import { useTheme } from "next-themes";

// Corregir el problema de los íconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  segmentos: Segmento[];
}

export function Map({ segmentos }: MapProps) {
  const golfoSanJose = { lat: -42.330728, lng: -64.315155 };
  const { theme } = useTheme();

  // Agrupar segmentos por transecta
  const segmentosPorTransecta = segmentos.reduce((acc, segmento) => {
    if (!acc[segmento.transectId]) {
      acc[segmento.transectId] = [];
    }
    acc[segmento.transectId].push(segmento);
    return acc;
  }, {} as Record<number, Segmento[]>);

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <MapContainer
        center={[golfoSanJose.lat, golfoSanJose.lng]}
        zoom={11}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>'
          url={
            theme === "dark"
              ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          }
        />
        {Object.values(segmentosPorTransecta).map((transectaSegmentos) => {
          // Ordenar segmentos por número
          const segmentosOrdenados = transectaSegmentos.sort(
            (a, b) => a.numero - b.numero
          );

          // Crear array de puntos para la línea
          const puntos: [number, number][] = [];

          return (
            <div key={segmentosOrdenados[0]?.transectId}>
              {segmentosOrdenados.map((segmento, index) => {
                if (!segmento.coordenadasInicio || !segmento.coordenadasFin)
                  return null;

                // Para el primer segmento, mostrar tanto inicio como fin
                if (index === 0) {
                  puntos.push([
                    segmento.coordenadasInicio.latitud,
                    segmento.coordenadasInicio.longitud,
                  ]);
                  puntos.push([
                    segmento.coordenadasFin.latitud,
                    segmento.coordenadasFin.longitud,
                  ]);

                  return (
                    <div key={segmento.id}>
                      <Marker
                        position={[
                          segmento.coordenadasInicio.latitud,
                          segmento.coordenadasInicio.longitud,
                        ]}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-bold">
                              Segmento {segmento.numero} - Inicio
                            </h3>
                            <p>
                              Profundidad:{" "}
                              {segmento.coordenadasInicio.profundidad}m
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                      <Marker
                        position={[
                          segmento.coordenadasFin.latitud,
                          segmento.coordenadasFin.longitud,
                        ]}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-bold">
                              Segmento {segmento.numero} - Fin
                            </h3>
                            <p>
                              Profundidad: {segmento.coordenadasFin.profundidad}
                              m
                              {segmento.conteo && (
                                <div>Conteo: {segmento.conteo}</div>
                              )}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    </div>
                  );
                }

                // Para los demás segmentos, solo mostrar el fin
                puntos.push([
                  segmento.coordenadasFin.latitud,
                  segmento.coordenadasFin.longitud,
                ]);

                return (
                  <Marker
                    key={segmento.id}
                    position={[
                      segmento.coordenadasFin.latitud,
                      segmento.coordenadasFin.longitud,
                    ]}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">
                          Segmento {segmento.numero} - Fin
                        </h3>
                        <p>
                          Profundidad: {segmento.coordenadasFin.profundidad}m
                          {segmento.conteo && (
                            <div>Conteo: {segmento.conteo}</div>
                          )}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              <Polyline
                positions={puntos}
                color={theme === "dark" ? "#fff" : "#000"}
                weight={2}
                opacity={0.7}
              />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
