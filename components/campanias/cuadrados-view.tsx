"use client";

import { CuadradosList } from "@/components/cuadrados/cuadrados-list";
import {
  getCuadradosByCampaniaAction,
  Cuadrado,
} from "@/lib/actions/cuadrados";
import { Campania } from "@/lib/types/campania";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface CuadradosViewProps {
  campania: Campania;
  cuadrados: Cuadrado[];
}

export function CuadradosView({
  campania,
  cuadrados: initialCuadrados,
}: CuadradosViewProps) {
  const [cuadrados, setCuadrados] = useState<Cuadrado[]>(initialCuadrados);
  const [isLoading, setIsLoading] = useState(false);

  const loadCuadrados = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getCuadradosByCampaniaAction(campania.id);
      if (error) throw new Error(error);
      setCuadrados(data || []);
    } catch (error) {
      console.error("Error loading cuadrados:", error);
      toast.error("Error al cargar los cuadrados");
    } finally {
      setIsLoading(false);
    }
  }, [campania.id]);

  return (
    <div className="w-full min-h-0 h-full p-6 flex flex-col">
      <div className="flex-1">
        <CuadradosList
          cuadrados={cuadrados}
          isLoading={isLoading}
          campaniaId={campania.id}
          onCuadradoAdded={loadCuadrados}
        />
      </div>
    </div>
  );
}
