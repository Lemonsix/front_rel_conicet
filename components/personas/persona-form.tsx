"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPersonaAction,
  updatePersonaAction,
} from "@/lib/actions/personas";
import { Persona } from "@/lib/types/persona";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Roles disponibles
const ROLES = ["BUZO", "PLANILLERO", "INVESTIGADOR", "PROGRAMADOR"];

interface PersonaFormProps {
  onSuccess?: () => void;
  persona?: Persona;
  mode?: "create" | "edit";
  trigger?: React.ReactNode;
}

export function PersonaForm({
  onSuccess,
  persona,
  mode = "create",
  trigger,
}: PersonaFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rol, setRol] = useState(ROLES[0]);

  // Cargar datos de la persona cuando se edita
  useEffect(() => {
    if (persona && mode === "edit") {
      setNombre(persona.nombre);
      setApellido(persona.apellido);
      setRol(persona.rol);
    }
  }, [persona, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "create") {
        const result = await createPersonaAction({ nombre, apellido, rol });
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success("Persona agregada exitosamente");
      } else if (mode === "edit" && persona) {
        const result = await updatePersonaAction(persona.id, {
          nombre,
          apellido,
          rol,
        });
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success("Persona actualizada exitosamente");
      }

      setNombre("");
      setApellido("");
      setRol(ROLES[0]);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : mode === "create"
          ? "Error al agregar persona"
          : "Error al actualizar persona"
      );
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle =
    mode === "create" ? "Agregar Nueva Persona" : "Editar Persona";
  const buttonText = mode === "create" ? "Nueva Persona" : "Editar";
  const submitText = loading ? "Guardando..." : "Guardar";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{buttonText}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
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
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select value={rol} onValueChange={setRol} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((rolOption) => (
                  <SelectItem key={rolOption} value={rolOption}>
                    {rolOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {submitText}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
