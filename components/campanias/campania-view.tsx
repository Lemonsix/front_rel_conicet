"use client";

import { TransectaMap } from "@/components/map/transecta-map";
import { TransectasAccordion } from "@/components/transectas/transectas-accordion";
import { getEmbarcacionesAction } from "@/lib/actions/embarcaciones";
import { getPersonasByRolAction } from "@/lib/actions/personas";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { mapSegmentos } from "@/lib/mappers/segmentos";
import { Campania } from "@/lib/types/campania";
import { Embarcacion } from "@/lib/types/embarcacion";
import { Persona } from "@/lib/types/persona";
import { Segmento } from "@/lib/types/segmento";
import { Transecta } from "@/lib/types/transecta";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TransectaModal } from "../transectas/transecta-modal";

interface CampaniaViewProps {
  campania: Campania;
  transectas: Transecta[];
}

export function CampaniaView({
  campania,
  transectas: initialTransectas,
}: CampaniaViewProps) {
  const [transectasAbiertas, setTransectasAbiertas] = useState<Set<number>>(
    new Set()
  );
  const [transectas, setTransectas] = useState<Transecta[]>(initialTransectas);
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [buzos, setBuzos] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [segmentosCargados, setSegmentosCargados] = useState<
    Record<number, Segmento[]>
  >({});
  const [cargandoSegmentos, setCargandoSegmentos] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener embarcaciones
        const { data: embarcacionesData, error: embarcacionesError } =
          await getEmbarcacionesAction();
        if (embarcacionesError) throw new Error(embarcacionesError);
        setEmbarcaciones(
          embarcacionesData?.map((e) => ({
            id: e.id,
            nombre: e.nombre,
            matricula: e.matricula || "",
          })) || []
        );

        // Obtener buzos
        const { data: buzosData, error: buzosError } =
          await getPersonasByRolAction("BUZO");
        if (buzosError) throw new Error(buzosError);
        setBuzos(buzosData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleTransectaOpen = async (transectaId: number) => {
    setTransectasAbiertas((prev) => new Set([...prev, transectaId]));

    // Si ya tenemos los segmentos cargados, no los volvemos a cargar
    if (segmentosCargados[transectaId]) {
      return;
    }

    setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: true }));
    try {
      const result = await getSegmentosByTransectaAction(transectaId);
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error("No se encontraron datos");
      }

      const segmentosMapeados = mapSegmentos(result.data);

      setSegmentosCargados((prev) => ({
        ...prev,
        [transectaId]: segmentosMapeados as Segmento[],
      }));
    } catch (error) {
      console.error("Error cargando segmentos:", error);
      toast.error("Error al cargar los segmentos");
    } finally {
      setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: false }));
    }
  };

  const handleTransectaClose = (transectaId: number) => {
    setTransectasAbiertas((prev) => {
      const next = new Set(prev);
      next.delete(transectaId);
      return next;
    });
  };

  // Obtener todos los segmentos de las transectas abiertas
  const segmentosVisibles = transectas
    .filter((t) => transectasAbiertas.has(t.id))
    .flatMap((t) => segmentosCargados[t.id] || [])
    .filter(Boolean);

  const handleSegmentoCreado = async () => {
    try {
      // Recargar los segmentos de todas las transectas abiertas
      for (const transectaId of transectasAbiertas) {
        setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: true }));
        try {
          const result = await getSegmentosByTransectaAction(transectaId);
          if (result.error) {
            throw new Error(result.error);
          }

          if (!result.data) {
            throw new Error("No se encontraron datos");
          }

          const segmentosMapeados = mapSegmentos(result.data);

          setSegmentosCargados((prev) => ({
            ...prev,
            [transectaId]: segmentosMapeados as Segmento[],
          }));
        } catch (error) {
          console.error("Error cargando segmentos:", error);
          toast.error("Error al cargar los segmentos");
        } finally {
          setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: false }));
        }
      }
    } catch (error) {
      console.error("Error recargando segmentos:", error);
      toast.error("Error al actualizar los datos");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-full p-6 overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{campania.nombre}</h1>
              <p className="text-muted-foreground">{campania.observaciones}</p>
            </div>
            {!isLoading && (
              <TransectaModal
                campaniaId={campania.id}
                embarcaciones={embarcaciones}
                buzos={buzos}
              />
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <TransectasAccordion
              transectas={transectas}
              onTransectaOpen={handleTransectaOpen}
              onTransectaClose={handleTransectaClose}
              onSegmentoCreado={handleSegmentoCreado}
              segmentosCargados={segmentosCargados}
              cargandoSegmentos={cargandoSegmentos}
            />
          </div>
        </div>
      </div>
      <div className="w-full h-full overflow-hidden">
        <TransectaMap segmentos={segmentosVisibles} />
      </div>
    </div>
  );
}
