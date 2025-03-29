"use client";

import { useEffect, useState } from "react";
import { Campania } from "@/lib/types/campania";
import { toast } from "sonner";
import { CampaniaForm } from "./campania-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loading } from "../ui/loading";
import { getCampaniasAction } from "@/lib/actions/campanias";

interface CampaniaData {
  id: number;
  nombre: string;
  inicio: string;
  fin: string;
  observaciones: string | null;
  responsable: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }>;
  cantidadTransectas: Array<{ count: number }>;
}

export function CampaniasGrid() {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampanias = async () => {
    try {
      const result = await getCampaniasAction();

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error("No se encontraron datos");
      }

      const campaniasProcesadas = result.data.map((item: CampaniaData) => ({
        id: item.id,
        nombre: item.nombre,
        responsable: item.responsable?.[0] || {
          id: 0,
          nombre: "Sin responsable",
          apellido: "",
          rol: "",
        },
        inicio: item.inicio,
        fin: item.fin,
        cantidadTransectas: item.cantidadTransectas?.[0]?.count || 0,
      }));

      setCampanias(campaniasProcesadas);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al cargar las campañas"
      );
      toast.error("Error al cargar las campañas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampanias();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (isLoading) {
    return <Loading text="Cargando campañas..." />;
  }

  return (
    <div className="flex flex-col min-h-0 w-full pb-20 ">
      <div className="flex justify-end p-4">
        <CampaniaForm onSuccess={fetchCampanias} />
      </div>
      <ScrollArea className="h-full w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {campanias.map((campania) => (
            <Link
              key={campania.id}
              href={`/campanias/${campania.id}`}
              className="block"
            >
              <Card className="h-full hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle>{campania.nombre}</CardTitle>
                  <CardDescription>
                    Responsable: {campania.responsable.nombre}{" "}
                    {campania.responsable.apellido}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Transectas: {campania.cantidadTransectas}</p>
                  {campania.inicio && (
                    <p>
                      Inicio: {new Date(campania.inicio).toLocaleDateString()}
                    </p>
                  )}
                  {campania.fin && (
                    <p>Fin: {new Date(campania.fin).toLocaleDateString()}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
