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
import { PersonaForm } from "./persona-form";
import { Persona } from "@/lib/types/persona";
import { createClient } from "@/utils/supabase/client";
import { ScrollArea } from "../ui/scroll-area";
import { Loading } from "../ui/loading";

function PersonasTableContent() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const { data, error } = await supabase
          .from("personas")
          .select("*")
          .order("id", { ascending: true });

        if (error) {
          console.error("Error cargando personas:", error);
          return;
        }

        setPersonas(data || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  if (isLoading) {
    return <Loading text="Cargando personas..." />;
  }

  const handleAddPersona = async (nuevaPersona: Omit<Persona, "id">) => {
    const { data, error } = await supabase
      .from("personas")
      .insert([nuevaPersona])
      .select()
      .single();

    if (error) {
      console.error("Error agregando persona:", error);
      return;
    }

    setPersonas([...personas, data]);
  };

  return (
    <div className="flex flex-col min-h-0 w-full pb-20">
      <div className="flex justify-end p-4">
        <PersonaForm onSubmit={handleAddPersona} />
      </div>
      <ScrollArea className="h-full w-full">
        <div className="p-4">
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
                  <TableCell>{persona.apellido}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}

export function PersonasTable() {
  return (
    <div className="flex flex-col min-h-0 w-full">
      <PersonasTableContent />
    </div>
  );
}
