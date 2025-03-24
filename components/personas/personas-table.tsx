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
import { PersonaForm } from "./persona-form";
import { Persona } from "@/lib/types/persona";
import { getPersonasAction } from "@/lib/actions/personas";
import { ScrollArea } from "../ui/scroll-area";
import { Loading } from "../ui/loading";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

function PersonasTableContent() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPersonas = async () => {
    try {
      const result = await getPersonasAction();

      if (result.error) {
        throw new Error(result.error);
      }

      setPersonas(result.data || []);
    } catch (error) {
      toast.error("Error al cargar personas");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  if (isLoading) {
    return <Loading text="Cargando personas..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PersonaForm onSuccess={fetchPersonas} />
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.map((persona) => (
              <TableRow key={persona.id}>
                <TableCell>{persona.id}</TableCell>
                <TableCell>{persona.nombre}</TableCell>
                <TableCell>{persona.apellido}</TableCell>
                <TableCell>{persona.rol}</TableCell>
                <TableCell>
                  <PersonaForm
                    mode="edit"
                    persona={persona}
                    onSuccess={fetchPersonas}
                    trigger={
                      <Button size="icon" variant="ghost">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

export function PersonasTable() {
  return <PersonasTableContent />;
}
