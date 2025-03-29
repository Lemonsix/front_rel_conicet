"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransectaForm } from "./transecta-form";
import { useState } from "react";

interface TransectaModalProps {
  campaniaId: number;
  embarcaciones: Array<{
    id: number;
    nombre: string;
    matricula: string;
  }>;
  buzos: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }>;
  onTransectaCreated?: () => Promise<void> | void;
}

export function TransectaModal({
  campaniaId,
  embarcaciones,
  buzos,
  onTransectaCreated,
}: TransectaModalProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onTransectaCreated) {
      onTransectaCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva transecta</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva transecta</DialogTitle>
        </DialogHeader>
        <TransectaForm
          campaniaId={campaniaId}
          embarcaciones={embarcaciones}
          buzos={buzos}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
