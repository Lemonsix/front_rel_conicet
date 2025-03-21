"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Responsable {
  id: number
  nombre: string
}

interface Campania {
  id: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  cantidadTransectas: number
  responsable: Responsable
}

const campanias: Campania[] = [
  {
    id: 1,
    nombre: "Campaña de Monitoreo Costero 2024",
    fechaInicio: "2024-03-15",
    fechaFin: "2024-04-15",
    cantidadTransectas: 12,
    responsable: {
      id: 101,
      nombre: "Dr. María González"
    }
  },
  {
    id: 2,
    nombre: "Estudio de Biodiversidad Marina",
    fechaInicio: "2024-05-01",
    fechaFin: "2024-06-30",
    cantidadTransectas: 8,
    responsable: {
      id: 102,
      nombre: "Dr. Juan Martínez"
    }
  },
  {
    id: 3,
    nombre: "Monitoreo de Especies Invasoras",
    fechaInicio: "2024-07-10",
    fechaFin: "2024-08-10",
    cantidadTransectas: 15,
    responsable: {
      id: 103,
      nombre: "Dra. Ana Rodríguez"
    }
  },
  {
    id: 4,
    nombre: "Evaluación de Ecosistemas Costeros",
    fechaInicio: "2024-09-01",
    fechaFin: "2024-10-15",
    cantidadTransectas: 10,
    responsable: {
      id: 104,
      nombre: "Dr. Carlos López"
    }
  }
]

export default function CampaniasPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Campañas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {campanias.map((campania) => (
          <Link 
            href={`/campanias/${campania.id}`} 
            key={campania.id}
            className="block"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{campania.nombre}</CardTitle>
                <CardDescription>
                  Responsable: {campania.responsable.nombre}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fecha Inicio:</span>
                    <Badge variant="secondary">
                      {new Date(campania.fechaInicio).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Fecha Fin:</span>
                    <Badge variant="secondary">
                      {new Date(campania.fechaFin).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Transectas:</span>
                    <Badge variant="outline">
                      {campania.cantidadTransectas}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
} 