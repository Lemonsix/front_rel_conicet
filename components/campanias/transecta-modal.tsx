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
}

export function TransectaModal({
  campaniaId,
  embarcaciones,
  buzos,
}: TransectaModalProps) {
  const [open, setOpen] = useState(false);

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
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
