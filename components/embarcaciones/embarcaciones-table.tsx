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

function EmbarcacionesTableContent() {
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
    };

    fetchEmbarcaciones();
  }, []);

  const handleAddEmbarcacion = (nuevaEmbarcacion: Omit<Embarcacion, "id">) => {
    setEmbarcaciones([...embarcaciones, nuevaEmbarcacion as Embarcacion]);
  };

  if (loading) return <div>Cargando embarcaciones...</div>;

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
  );
}

export function EmbarcacionesTable() {
  return (
    <div className="w-full">
      <Suspense fallback={<div>Cargando embarcaciones...</div>}>
        <EmbarcacionesTableContent />
      </Suspense>
    </div>
  );
}
