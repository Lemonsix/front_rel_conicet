"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmbarcacionForm } from "./embarcacion-form";
import { Embarcacion } from "@/lib/types/embarcacion";
import { getEmbarcacionesAction } from "@/lib/actions/embarcaciones";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loading } from "@/components/ui/loading";

function EmbarcacionesTableContent() {
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmbarcaciones = async () => {
    try {
      const result = await getEmbarcacionesAction();

      if (result.error) {
        throw new Error(result.error);
      }

      setEmbarcaciones(result.data || []);
    } catch (error) {
      toast.error("Error al cargar embarcaciones");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmbarcaciones();
  }, []);

  if (isLoading) {
    return <Loading text="Cargando embarcaciones..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <EmbarcacionForm onSuccess={fetchEmbarcaciones} />
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Matrícula</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {embarcaciones.map((embarcacion) => (
              <TableRow key={embarcacion.id}>
                <TableCell>{embarcacion.id}</TableCell>
                <TableCell>{embarcacion.nombre}</TableCell>
                <TableCell>{embarcacion.matricula}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

export function EmbarcacionesTable() {
  return <EmbarcacionesTableContent />;
}
