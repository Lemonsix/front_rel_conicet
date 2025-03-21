"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Embarcacion } from "@/types/embarcacion"

interface EmbarcacionFormProps {
  onSubmit: (embarcacion: Omit<Embarcacion, "id">) => void
}

export function EmbarcacionForm({ onSubmit }: EmbarcacionFormProps) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [patente, setPatente] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ nombre, patente })
    setNombre("")
    setPatente("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva Embarcación</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Embarcación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patente">Patente</Label>
            <Input
              id="patente"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              pattern="PBA-[0-9]{4}"
              title="La patente debe tener el formato PBA-XXXX"
              placeholder="PBA-1234"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 