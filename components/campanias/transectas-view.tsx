"use client";

import { TransectasList } from "@/components/transectas/transectas-list";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { mapSegmentos as mapSegmentosFunction } from "@/lib/mappers/segmentos";
import { mapTransectas } from "@/lib/mappers/transecta";
import { getTransectasByCampaniaAction } from "@/lib/actions/transectas";
import { Campania } from "@/lib/types/campania";
import { Embarcacion } from "@/lib/types/embarcacion";
import { Persona } from "@/lib/types/persona";
import { Segmento } from "@/lib/types/segmento";
import { Transecta } from "@/lib/types/transecta";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TransectaModal } from "../transectas/transecta-modal";
import { TransectaMap } from "../map/transecta-map";

interface TransectasViewProps {
  campania: Campania;
  embarcaciones: Embarcacion[];
  buzos: Persona[];
}

// Función de utilidad para ordenar transectas
const ordenarTransectas = (transectas: Transecta[]): Transecta[] => {
  return [...transectas].sort((a, b) => {
    const nameA = a.nombre || "";
    const nameB = b.nombre || "";
    return nameA.localeCompare(nameB, "es-ES", {
      numeric: true,
      sensitivity: "base",
    });
  });
};

export function TransectasView({
  campania,
  embarcaciones,
  buzos,
}: TransectasViewProps) {
  const router = useRouter();

  // Estados principales
  const [transectasAbiertas, setTransectasAbiertas] = useState<Set<number>>(
    () => new Set()
  );

  // Estados de datos
  const [transectas, setTransectas] = useState<Transecta[]>(() => {
    return campania.transectas ? ordenarTransectas(campania.transectas) : [];
  });

  // Estados de carga
  const [isLoading, setIsLoading] = useState(false);

  // Estados de segmentos
  const [segmentosCargados, setSegmentosCargados] = useState<
    Record<number, Segmento[]>
  >({});
  const [cargandoSegmentos, setCargandoSegmentos] = useState<
    Record<number, boolean>
  >({});
  const [selectedTransectaId, setSelectedTransectaId] = useState<number | null>(
    null
  );

  // Función para cargar segmentos
  const loadSegmentos = useCallback(async (transectaId: number) => {
    if (segmentosCargados[transectaId] || cargandoSegmentos[transectaId]) {
      return;
    }

    setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: true }));
    try {
      const result = await getSegmentosByTransectaAction(transectaId);
      if (result.error) throw new Error(result.error);
      if (!result.data) throw new Error("No se encontraron datos");

      const segmentosMapeados = mapSegmentosFunction(result.data);
      setSegmentosCargados((prev) => ({
        ...prev,
        [transectaId]: segmentosMapeados as Segmento[],
      }));
    } catch (error) {
      console.error("Error loading segments:", error);
      toast.error("Error al cargar los segmentos");
    } finally {
      setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: false }));
    }
  }, []);

  // Handlers
  const handleTransectaOpen = useCallback(
    async (transectaId: number) => {
      setTransectasAbiertas((prev) => new Set([...prev, transectaId]));
      await loadSegmentos(transectaId);
    },
    [loadSegmentos]
  );

  const handleTransectaClose = useCallback((transectaId: number) => {
    setTransectasAbiertas((prev) => {
      const next = new Set(prev);
      next.delete(transectaId);
      return next;
    });
  }, []);

  const handleSegmentoCreado = useCallback(async () => {
    const transectaIds = Array.from(transectasAbiertas);

    // Invalidar el cache
    setSegmentosCargados((prev) => {
      const next = { ...prev };
      transectaIds.forEach((id) => delete next[id]);
      return next;
    });

    // Recargar segmentos
    await Promise.all(
      transectaIds.map(async (transectaId) => {
        setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: true }));
        try {
          const result = await getSegmentosByTransectaAction(transectaId);
          if (result.error) throw new Error(result.error);
          if (!result.data) throw new Error("No se encontraron datos");

          const segmentosMapeados = mapSegmentosFunction(result.data);
          setSegmentosCargados((prev) => ({
            ...prev,
            [transectaId]: segmentosMapeados as Segmento[],
          }));
        } catch (error) {
          console.error("Error loading segments:", error);
          toast.error("Error al cargar los segmentos");
        } finally {
          setCargandoSegmentos((prev) => ({ ...prev, [transectaId]: false }));
        }
      })
    );
  }, [transectasAbiertas]);

  const refreshTransectas = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: transectasData, error: transectasError } =
        await getTransectasByCampaniaAction(campania.id);

      if (transectasError) throw new Error(transectasError);

      if (transectasData) {
        const transectasMapeadas = mapTransectas(transectasData);
        setTransectas(ordenarTransectas(transectasMapeadas));

        // Recargar segmentos de transectas abiertas
        if (transectasAbiertas.size > 0) {
          const transectaIds = Array.from(transectasAbiertas);
          await Promise.all(transectaIds.map(loadSegmentos));
        }
      }

      setTimeout(() => {
        router.refresh();
      }, 100);

      toast.success("Transectas actualizadas correctamente");
    } catch (error) {
      console.error("Error refreshing transectas:", error);
      toast.error("Error al actualizar las transectas");
    } finally {
      setIsLoading(false);
    }
  }, [campania.id, transectasAbiertas, loadSegmentos, router]);

  // Segmentos para el mapa
  const segmentosParaMapa = useMemo(() => {
    return selectedTransectaId !== null &&
      segmentosCargados[selectedTransectaId]
      ? segmentosCargados[selectedTransectaId]
      : [];
  }, [selectedTransectaId, segmentosCargados]);

  return (
    <div className="w-full min-h-0 h-full p-6 flex flex-col">
      <div className="flex justify-end items-center mb-6">
        <TransectaModal
          campaniaId={campania.id}
          embarcaciones={embarcaciones}
          buzos={buzos}
          onTransectaCreated={refreshTransectas}
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="overflow-hidden h-full min-h-0">
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
        <div className="h-full overflow-hidden">
          <TransectaMap segmentos={segmentosParaMapa} />
        </div>
      </div>
    </div>
  );
}
