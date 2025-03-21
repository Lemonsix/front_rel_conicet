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
import { Persona } from "@/types/persona"
import { personas as personasIniciales } from "@/data/personas"
import { PersonaForm } from "./persona-form"

function PersonasTableContent() {
  const [personas, setPersonas] = useState<Persona[]>(personasIniciales)

  const handleAddPersona = (nuevaPersona: Omit<Persona, "id">) => {
    const id = Math.max(...personas.map(p => p.id)) + 1
    setPersonas([...personas, { ...nuevaPersona, id }])
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PersonaForm onSubmit={handleAddPersona} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>CUIT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {personas.map((persona) => (
            <TableRow key={persona.id}>
              <TableCell>{persona.id}</TableCell>
              <TableCell>{persona.nombre}</TableCell>
              <TableCell>{persona.cuit}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function PersonasTable() {
  return (
    <div className="w-full">
      <Suspense fallback={<div>Cargando personas...</div>}>
        <PersonasTableContent />
      </Suspense>
    </div>
  )
} 