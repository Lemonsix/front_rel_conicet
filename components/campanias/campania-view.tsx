"use client";

import { TransectasList } from "@/components/transectas/transectas-list";
import { getEmbarcacionesAction } from "@/lib/actions/embarcaciones";
import { getPersonasByRolAction } from "@/lib/actions/personas";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { getTransectasByCampaniaAction } from "@/lib/actions/transectas";
import { mapSegmentos as mapSegmentosFunction } from "@/lib/mappers/segmentos";
import { mapTransectas } from "@/lib/mappers/transecta";
import { Campania } from "@/lib/types/campania";
import { Embarcacion } from "@/lib/types/embarcacion";
import { Persona } from "@/lib/types/persona";
import { Segmento } from "@/lib/types/segmento";
import { Transecta } from "@/lib/types/transecta";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TransectaModal } from "../transectas/transecta-modal";
import { TransectaMap } from "../map/transecta-map";

interface CampaniaViewProps {
  campania: Campania;
}

export function CampaniaView({ campania }: CampaniaViewProps) {
  const [transectasAbiertas, setTransectasAbiertas] = useState<Set<number>>(
    new Set()
  );
  const [transectas, setTransectas] = useState<Transecta[]>(
    campania.transectas || []
  );
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [buzos, setBuzos] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [segmentosCargados, setSegmentosCargados] = useState<
    Record<number, Segmento[]>
  >({});
  const [cargandoSegmentos, setCargandoSegmentos] = useState<
    Record<number, boolean>
  >({});
  const [selectedTransectaId, setSelectedTransectaId] = useState<number | null>(
    null
  );

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

        // Obtener transectas de la campaña
        const { data: transectasData, error: transectasError } =
          await getTransectasByCampaniaAction(campania.id);
        if (transectasError) throw new Error(transectasError);
        if (transectasData) {
          const transectasMapeadas = mapTransectas(transectasData);
          setTransectas(transectasMapeadas);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [campania.id]);

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

      const segmentosMapeados = mapSegmentosFunction(result.data);

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

          const segmentosMapeados = mapSegmentosFunction(result.data);

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

  const refreshTransectas = async () => {
    try {
      const { data: transectasData, error: transectasError } =
        await getTransectasByCampaniaAction(campania.id);
      if (transectasError) throw new Error(transectasError);
      if (transectasData) {
        const transectasMapeadas = mapTransectas(transectasData);
        setTransectas(transectasMapeadas);
      }
    } catch (error) {
      console.error("Error refreshing transectas:", error);
      toast.error("Error al actualizar las transectas");
    }
  };

  // Get map segments for the selected transecta
  const segmentosParaMapa =
    selectedTransectaId !== null && segmentosCargados[selectedTransectaId]
      ? segmentosCargados[selectedTransectaId]
      : [];

  return (
    <div className="w-full h-[calc(100vh-4rem)] overflow-hidden p-6 flex flex-col">
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
            onTransectaCreated={refreshTransectas}
          />
        )}
      </div>

      <div className="mt-6 flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="overflow-hidden">
          <TransectasList
            transectas={transectas}
            onTransectaOpen={handleTransectaOpen}
            onTransectaClose={handleTransectaClose}
            onSegmentoCreado={handleSegmentoCreado}
            segmentosCargados={segmentosCargados}
            cargandoSegmentos={cargandoSegmentos}
            onTransectaSelect={setSelectedTransectaId}
          />
        </div>
        <div className="h-[500px] lg:h-auto">
          <TransectaMap segmentos={segmentosParaMapa} />
        </div>
      </div>
    </div>
  );
}
