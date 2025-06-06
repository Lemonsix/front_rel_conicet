"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Marisqueo } from "@/lib/actions/marisqueos";
import { NuevoMarisqueoForm } from "./nuevo-marisqueo-form";

interface MarisqueosListProps {
  marisqueos: Marisqueo[];
  isLoading: boolean;
  campaniaId: number;
  onMarisqueoAdded?: () => void;
}

export function MarisqueosList({
  marisqueos,
  isLoading,
  campaniaId,
  onMarisqueoAdded,
}: MarisqueosListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar por término de búsqueda
  const filteredMarisqueos = marisqueos.filter(
    (marisqueo) =>
      marisqueo.nombre_transecta
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      marisqueo.numero_segmento.toString().includes(searchTerm) ||
      (marisqueo.nombre_buzo &&
        marisqueo.nombre_buzo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Cargando marisqueos...</p>
      </div>
    );
  }

  if (marisqueos.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-medium mb-2">
          No hay marisqueos registrados
        </h3>
        <p className="text-muted-foreground mb-4">
          Los marisqueos se registran en los segmentos de las transectas.
        </p>
        <NuevoMarisqueoForm
          campaniaId={campaniaId}
          onSuccess={onMarisqueoAdded}
        />
      </div>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Marisqueos</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por transecta, segmento o buzo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <NuevoMarisqueoForm
              campaniaId={campaniaId}
              onSuccess={onMarisqueoAdded}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[calc(100vh-250px)]">
          <Table>
            <TableCaption>Lista de marisqueos registrados</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Transecta</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Buzo</TableHead>
                <TableHead>Captura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Profundidad</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead>Peso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarisqueos.map((marisqueo) => (
                <TableRow key={marisqueo.id}>
                  <TableCell className="font-medium">
                    {marisqueo.nombre_transecta}
                  </TableCell>
                  <TableCell>{marisqueo.numero_segmento}</TableCell>
                  <TableCell>{marisqueo.nombre_buzo || "-"}</TableCell>
                  <TableCell>{marisqueo.n_captura}</TableCell>
                  <TableCell>
                    {new Date(marisqueo.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{marisqueo.profundidad || "-"}</TableCell>
                  <TableCell>{marisqueo.tiempo || "-"}</TableCell>
                  <TableCell>{marisqueo.peso_muestra || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
