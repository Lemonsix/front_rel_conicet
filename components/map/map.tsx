import { Segmento } from "@/lib/types/segmento";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  useMap,
} from "react-leaflet";
import { useTheme } from "next-themes";

// Configurar el ícono del marcador
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
  tooltipAnchor: [16, -28],
});

// Componente para ajustar los bounds
function SetBounds() {
  const map = useMap();
  const gulfBounds = L.latLngBounds(
    [-42.43, -64.65], // Suroeste
    [-42.19, -64.02] // Noreste
  );

  // Ajusta los límites y el zoom inicial
  map.setMaxBounds(gulfBounds);
  map.fitBounds(gulfBounds);

  return null;
}

interface MapProps {
  segmentos: Segmento[];
}

export function Map({ segmentos }: MapProps) {
  const golfoSanJose = { lat: -42.330728, lng: -64.315155 };
  const { theme } = useTheme();

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
        maxBoundsViscosity={1.0} // Hace que los límites sean "pegajosos"
      >
        <SetBounds /> {/* Componente para ajustar los bounds */}
        <TileLayer
          url={
            theme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
        />
        {Object.values(segmentosPorTransecta).map((transectaSegmentos) => {
          const segmentosOrdenados = transectaSegmentos.sort(
            (a, b) => a.numero - b.numero
          );
          const puntos: [number, number][] = [];

          return (
            <div key={segmentosOrdenados[0]?.transectId}>
              {segmentosOrdenados.map((segmento, index) => {
                if (!segmento.coordenadasInicio || !segmento.coordenadasFin)
                  return null;

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
                        icon={icon}
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
                        icon={icon}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-bold">
                              Segmento {segmento.numero} - Fin
                            </h3>
                            <p className="flex flex-col">
                              <span>
                                Profundidad:{" "}
                                {segmento.coordenadasFin.profundidad}m
                              </span>
                              {segmento.conteo && (
                                <span>Conteo: {segmento.conteo}</span>
                              )}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    </div>
                  );
                }

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
                    icon={icon}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">
                          Segmento {segmento.numero} - Fin
                        </h3>
                        <p className="flex flex-col">
                          <span>
                            Profundidad: {segmento.coordenadasFin.profundidad}m
                          </span>
                          {segmento.conteo && (
                            <span>Conteo: {segmento.conteo}</span>
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
