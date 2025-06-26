"use client";

import { MarisqueosList } from "@/components/marisqueos/marisqueos-list";
import { getMarisqueosByCampaniaAction } from "@/lib/actions/marisqueos";
import { Marisqueo } from "@/lib/types/marisqueos";
import { Campania } from "@/lib/types/campania";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface MarisqueosViewProps {
  campania: Campania;
  marisqueos: Marisqueo[];
}

export function MarisqueosView({
  campania,
  marisqueos: initialMarisqueos,
}: MarisqueosViewProps) {
  const [marisqueos, setMarisqueos] = useState<Marisqueo[]>(initialMarisqueos);
  const [isLoading, setIsLoading] = useState(false);

  const loadMarisqueos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getMarisqueosByCampaniaAction(campania.id);
      if (error) throw new Error(error);
      setMarisqueos(data || []);
    } catch (error) {
      console.error("Error loading marisqueos:", error);
      toast.error("Error al cargar los marisqueos");
    } finally {
      setIsLoading(false);
    }
  }, [campania.id]);

  return (
    <div className="w-full min-h-0 h-full p-6 flex flex-col">
      <div className="flex-1 min-h-0">
        <MarisqueosList
          marisqueos={marisqueos}
          isLoading={isLoading}
          campaniaId={campania.id}
          onMarisqueoAdded={loadMarisqueos}
        />
      </div>
    </div>
  );
}
