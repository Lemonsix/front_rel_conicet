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

function PersonasTableContent() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchPersonas = async () => {
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error cargando personas:", error);
        return;
      }

      setPersonas(data || []);
    };

    fetchPersonas();
  }, []);

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <PersonaForm onSubmit={handleAddPersona} />
      </div>
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
  );
}

export function PersonasTable() {
  return (
    <div className="w-full">
      <Suspense fallback={<div>Cargando personas...</div>}>
        <PersonasTableContent />
      </Suspense>
    </div>
  );
}
