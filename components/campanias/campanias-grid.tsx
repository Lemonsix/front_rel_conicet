"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

interface Campania {
  id: number;
  nombre: string;
  responsable: { nombre: string };
  fechaInicio: string;
  fechaFin: string;
  cantidadTransectas: number;
}

export function CampaniasGrid() {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampanias = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Debes iniciar sesión para ver las campañas");
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("campanias")
          .select(
            `
              id,
              nombre,
              responsable:personas (
                id,
                nombre,
                apellido,
                rol
              ),
              cantidadTransectas: transectas ( count ),
              inicio,
              fin
            `
          )
          .order("nombre", { ascending: false });

        if (error) {
          console.error("Error fetching campanias:", error);
          setError(error.message);
          toast.error("Error al cargar las campañas");
          return;
        }

        const campaniasProcesadas =
          data?.map((item) => {
            if (
              !item.responsable ||
              (Array.isArray(item.responsable) && item.responsable.length === 0)
            ) {
              console.warn(`Campaña ${item.id} no tiene responsable asignado`);
              return {
                id: item.id,
                nombre: item.nombre,
                responsable: { nombre: "Sin responsable" },
                fechaInicio: item.inicio,
                fechaFin: item.fin,
                cantidadTransectas:
                  Array.isArray(item.cantidadTransectas) &&
                  item.cantidadTransectas.length > 0
                    ? item.cantidadTransectas[0].count
                    : 0,
              };
            }

            const responsableData = Array.isArray(item.responsable)
              ? item.responsable[0]
              : item.responsable;

            return {
              id: item.id,
              nombre: item.nombre,
              responsable: {
                nombre: responsableData
                  ? `${responsableData.nombre} ${responsableData.apellido}`
                  : "Sin responsable",
              },
              fechaInicio: item.inicio,
              fechaFin: item.fin,
              cantidadTransectas:
                Array.isArray(item.cantidadTransectas) &&
                item.cantidadTransectas.length > 0
                  ? item.cantidadTransectas[0].count
                  : 0,
            };
          }) || [];

        setCampanias(campaniasProcesadas);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching campanias:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Error al cargar las campañas"
        );
        toast.error("Error al cargar las campañas");
        setIsLoading(false);
      }
    };

    fetchCampanias();
  }, []);

  if (isLoading) {
    return <div className="p-6">Cargando campañas...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 p-6 overflow-y-scroll">
      {campanias.map((campania) => (
        <Link href={`/campanias/${campania.id}`} key={campania.id}>
          <Card key={campania.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{campania.nombre}</CardTitle>
              <CardDescription>
                Responsable: {campania.responsable.nombre}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Fecha Inicio:
                  </span>
                  <Badge variant="secondary">
                    {new Date(campania.fechaInicio).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Fecha Fin:
                  </span>
                  <Badge variant="secondary">
                    {new Date(campania.fechaFin).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Transectas:
                  </span>
                  <Badge variant="outline">{campania.cantidadTransectas}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
