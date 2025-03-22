"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
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

export function CampaniasGrid() {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const campaniasProcesadas: Campania[] =
        data?.map((item: any) => {
          if (
            !item.responsable ||
            (Array.isArray(item.responsable) && item.responsable.length === 0)
          ) {
            console.warn(`Campaña ${item.id} no tiene responsable asignado`);
            return {
              id: item.id,
              nombre: item.nombre,
              responsable: {
                id: 0,
                nombre: "Sin responsable",
                apellido: "",
                rol: "",
              },
              inicio: item.inicio,
              fin: item.fin,
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
            responsable: responsableData,
            inicio: item.inicio,
            fin: item.fin,
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
        error instanceof Error ? error.message : "Error al cargar las campañas"
      );
      toast.error("Error al cargar las campañas");
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
    <div className="flex flex-col min-h-0 w-full pb-20">
      <div className="flex justify-end p-4">
        <CampaniaForm onCampaniaCreada={fetchCampanias} />
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
