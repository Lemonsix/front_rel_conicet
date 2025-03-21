"use client"

import { TransectasAccordion } from "@/components/transectas/transectas-accordion"
import { TransectaMap } from "@/components/map/transecta-map"
import { Campania } from "@/lib/types/campania"

// Datos de ejemplo - En un caso real, esto vendría de una API
const campania: Campania = {
  id: 1,
  nombre: "Campaña de Monitoreo Costero 2024",
  descripcion: "Monitoreo de especies marinas en el Golfo San José",
  fechaInicio: "2024-03-15",
  fechaFin: "2024-04-15",
  transectas: [
    {
      id: 1,
      nombre: "Transecta Norte",
      descripcion: "Monitoreo de la zona norte del golfo",
      fecha: new Date("2024-03-15"),
      horaInicio: new Date("2024-03-15T09:00:00"),
      horaFin: new Date("2024-03-15T17:00:00"),
      embarcacion: {
        id: 1,
        nombre: "María del Mar",
        patente: "PBA-1234"
      },
      campaniaId: 1,
      segmentos: [
        {
          id: 1,
          nombre: "Segmento 1",
          descripcion: "Primer segmento de la transecta",
          campaniaId: 1,
          marisqueos: [],
          quadrats: [],
          waypoints: [
            {
              id: 1,
              latitud: -42.330728,
              longitud: -64.315155,
              profundidad: 5
            },
            {
              id: 2,
              latitud: -42.340728,
              longitud: -64.325155,
              profundidad: 7
            }
          ]
        }
      ]
    }
  ]
}

export default function CampaniaPage({ params }: { params: { campaniaId: string } }) {
  const { campaniaId } = params

  // Obtener todos los segmentos de todas las transectas
  const todosLosSegmentos = campania.transectas.flatMap(t => t.segmentos)

  return (
    <div className="flex h-full w-full">
      <div className="w-1/2 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">{campania.nombre}</h1>
        <p className="text-muted-foreground mb-6">{campania.descripcion}</p>
        <TransectasAccordion transectas={campania.transectas} />
      </div>
      <div className="w-1/2">
        <TransectaMap segmentos={todosLosSegmentos} />
      </div>
    </div>
  )
}