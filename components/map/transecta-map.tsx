"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Segmento } from "@/lib/types/segmento"

// Corregir el problema de los íconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface TransectaMapProps {
  segmentos: Segmento[]
}

export function TransectaMap({ segmentos }: TransectaMapProps) {
  const golfoSanJose = { lat: -42.330728, lng: -64.315155 }

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <MapContainer
        center={[golfoSanJose.lat, golfoSanJose.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {segmentos.map((segmento) => (
          <div key={segmento.id}>
            {segmento.waypoints.map((waypoint) => (
              <Marker
                key={waypoint.id}
                position={[waypoint.latitud, waypoint.longitud]}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{segmento.nombre}</h3>
                    <p>Profundidad: {waypoint.profundidad}m</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </div>
        ))}
      </MapContainer>
    </div>
  )
} 