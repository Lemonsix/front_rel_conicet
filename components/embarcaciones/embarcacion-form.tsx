"use client";

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
  createEmbarcacionAction,
  updateEmbarcacionAction,
} from "@/lib/actions/embarcaciones";
import { Embarcacion } from "@/lib/types/embarcacion";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EmbarcacionFormProps {
  onSuccess?: () => void;
  embarcacion?: Embarcacion;
  mode?: "create" | "edit";
  trigger?: React.ReactNode;
}

export function EmbarcacionForm({
  onSuccess,
  embarcacion,
  mode = "create",
  trigger,
}: EmbarcacionFormProps) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [matricula, setMatricula] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos de la embarcación cuando se edita
  useEffect(() => {
    if (embarcacion && mode === "edit") {
      setNombre(embarcacion.nombre);
      setMatricula(embarcacion.matricula);
    }
  }, [embarcacion, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        const result = await createEmbarcacionAction({ nombre, matricula });
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success("Embarcación creada exitosamente");
      } else if (mode === "edit" && embarcacion) {
        const result = await updateEmbarcacionAction(embarcacion.id, {
          nombre,
          matricula,
        });
        if (result.error) {
          throw new Error(result.error);
        }
        toast.success("Embarcación actualizada exitosamente");
      }

      setNombre("");
      setMatricula("");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : mode === "create"
          ? "Error al crear la embarcación"
          : "Error al actualizar la embarcación"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle =
    mode === "create" ? "Agregar Nueva Embarcación" : "Editar Embarcación";
  const buttonText = mode === "create" ? "Nueva Embarcación" : "Editar";
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
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="PBA-1234"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {submitText}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
