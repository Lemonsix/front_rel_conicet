"use client"

import { Suspense, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Embarcacion } from "@/types/embarcacion"
import { embarcaciones as embarcacionesIniciales } from "@/data/embarcaciones"
import { EmbarcacionForm } from "./embarcacion-form"

function EmbarcacionesTableContent() {
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>(embarcacionesIniciales)

  const handleAddEmbarcacion = (nuevaEmbarcacion: Omit<Embarcacion, "id">) => {
    const id = Math.max(...embarcaciones.map(e => e.id)) + 1
    setEmbarcaciones([...embarcaciones, { ...nuevaEmbarcacion, id }])
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <EmbarcacionForm onSubmit={handleAddEmbarcacion} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Patente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {embarcaciones.map((embarcacion) => (
            <TableRow key={embarcacion.id}>
              <TableCell>{embarcacion.id}</TableCell>
              <TableCell>{embarcacion.nombre}</TableCell>
              <TableCell>{embarcacion.patente}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function EmbarcacionesTable() {
  return (
    <div className="w-full">
      <Suspense fallback={<div>Cargando embarcaciones...</div>}>
        <EmbarcacionesTableContent />
      </Suspense>
    </div>
  )
} 