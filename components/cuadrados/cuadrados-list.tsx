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
import { Cuadrado } from "@/lib/actions/cuadrados";
import { NuevoCuadradoForm } from "./nuevo-cuadrado-form";

interface CuadradosListProps {
  cuadrados: Cuadrado[];
  isLoading: boolean;
  campaniaId: number;
  onCuadradoAdded?: () => void;
}

export function CuadradosList({
  cuadrados,
  isLoading,
  campaniaId,
  onCuadradoAdded,
}: CuadradosListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar por término de búsqueda
  const filteredCuadrados = cuadrados.filter(
    (cuadrado) =>
      cuadrado.nombre_transecta
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      cuadrado.numero_segmento.toString().includes(searchTerm) ||
      cuadrado.replica.toString().includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Cargando cuadrados...</p>
      </div>
    );
  }

  if (cuadrados.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-medium mb-2">
          No hay cuadrados registrados
        </h3>
        <p className="text-muted-foreground mb-4">
          Los cuadrados se registran en los segmentos de las transectas.
        </p>
        <NuevoCuadradoForm
          campaniaId={campaniaId}
          onSuccess={onCuadradoAdded}
        />
      </div>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Cuadrados</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por transecta, segmento o réplica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <NuevoCuadradoForm
              campaniaId={campaniaId}
              onSuccess={onCuadradoAdded}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[calc(100vh-250px)]">
          <Table>
            <TableCaption>Lista de cuadrados registrados</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Transecta</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Réplica</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Profundidad Inicial</TableHead>
                <TableHead>Profundidad Final</TableHead>
                <TableHead>Conteo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCuadrados.map((cuadrado) => (
                <TableRow key={cuadrado.id}>
                  <TableCell className="font-medium">
                    {cuadrado.nombre_transecta}
                  </TableCell>
                  <TableCell>{cuadrado.numero_segmento}</TableCell>
                  <TableCell>{cuadrado.replica}</TableCell>
                  <TableCell>{cuadrado.tamanio}</TableCell>
                  <TableCell>
                    {new Date(cuadrado.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{cuadrado.profundidad_inicio || "-"}</TableCell>
                  <TableCell>{cuadrado.profundidad_fin || "-"}</TableCell>
                  <TableCell>{cuadrado.conteo || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
