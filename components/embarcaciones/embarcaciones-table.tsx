"use client";

import { Suspense, useState, useEffect } from "react";
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
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loading } from "@/components/ui/loading";

function EmbarcacionesTableContent() {
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchEmbarcaciones = async () => {
      try {
        const { data, error } = await supabase
          .from("embarcaciones")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;
        setEmbarcaciones(data || []);
      } catch (error) {
        toast.error("Error al cargar embarcaciones");
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmbarcaciones();
  }, []);

  if (isLoading) {
    return <Loading text="Cargando embarcaciones..." />;
  }

  const handleAddEmbarcacion = (nuevaEmbarcacion: Omit<Embarcacion, "id">) => {
    setEmbarcaciones([...embarcaciones, nuevaEmbarcacion as Embarcacion]);
  };

  return (
    <div className="flex flex-col min-h-0 w-full pb-20">
      <div className="flex justify-end p-4">
        <EmbarcacionForm onSubmit={handleAddEmbarcacion} />
      </div>
      <ScrollArea className="h-full w-full">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Matricula</TableHead>
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
        </div>
      </ScrollArea>
    </div>
  );
}

export function EmbarcacionesTable() {
  return (
    <div className="flex flex-col min-h-0 w-full">
      <EmbarcacionesTableContent />
    </div>
  );
}
