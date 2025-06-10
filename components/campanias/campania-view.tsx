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
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TransectaModal } from "../transectas/transecta-modal";
import { TransectaMap } from "../map/transecta-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarisqueosList } from "../marisqueos/marisqueos-list";
import { CuadradosList } from "../cuadrados/cuadrados-list";
import {
  getCuadradosByCampaniaAction,
  Cuadrado,
} from "@/lib/actions/cuadrados";
import {
  getMarisqueosByCampaniaAction,
  Marisqueo,
} from "@/lib/actions/marisqueos";

interface CampaniaViewProps {
  campania: Campania;
}

type TabValue = "transectas" | "marisqueos" | "cuadrados";

// Función de utilidad para ordenar transectas (fuera del componente para evitar dependencias)
const ordenarTransectas = (transectas: Transecta[]): Transecta[] => {
  return [...transectas].sort((a, b) => {
    // Implementación simple pero robusta de sorting numérico-alfanumérico
    const nameA = a.nombre || "";
    const nameB = b.nombre || "";

    // Comparación alfanumérica básica que funciona igual en servidor y cliente
    return nameA.localeCompare(nameB, "es-ES", {
      numeric: true,
      sensitivity: "base",
    });
  });
};

export function CampaniaView({ campania }: CampaniaViewProps) {
  const router = useRouter();

  // Estados principales - inicializados de forma estable
  const [activeTab, setActiveTab] = useState<TabValue>("transectas");
  const [transectasAbiertas, setTransectasAbiertas] = useState<Set<number>>(
    () => new Set()
  );

  // Estados de datos - inicializados con valores estables
  const [transectas, setTransectas] = useState<Transecta[]>(() => {
    return campania.transectas ? ordenarTransectas(campania.transectas) : [];
  });
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [buzos, setBuzos] = useState<Persona[]>([]);
  const [marisqueos, setMarisqueos] = useState<Marisqueo[]>([]);
  const [cuadrados, setCuadrados] = useState<Cuadrado[]>([]);

  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMarisqueos, setIsLoadingMarisqueos] = useState(false);
  const [isLoadingCuadrados, setIsLoadingCuadrados] = useState(false);

  // Estados de segmentos - optimizados
  const [segmentosCargados, setSegmentosCargados] = useState<
    Record<number, Segmento[]>
  >({});
  const [cargandoSegmentos, setCargandoSegmentos] = useState<
    Record<number, boolean>
  >({});
  const [selectedTransectaId, setSelectedTransectaId] = useState<number | null>(
    null
  );

  // Función optimizada para cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      // Solo cargar embarcaciones y buzos, NO transectas ya que vienen con la campaña
      const [embarcacionesResult, buzosResult] = await Promise.all([
        getEmbarcacionesAction(),
        getPersonasByRolAction("BUZO"),
      ]);

      if (embarcacionesResult.error) throw new Error(embarcacionesResult.error);
      if (buzosResult.error) throw new Error(buzosResult.error);

      setEmbarcaciones(
        embarcacionesResult.data?.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          matricula: e.matricula || "",
        })) || []
      );

      setBuzos(buzosResult.data || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Error al cargar los datos iniciales");
    } finally {
      setIsLoading(false);
    }
  }, [campania.id]);

  // Función optimizada para cargar marisqueos
  const loadMarisqueos = useCallback(async () => {
    if (isLoadingMarisqueos) return;

    setIsLoadingMarisqueos(true);
    try {
      const { data, error } = await getMarisqueosByCampaniaAction(campania.id);
      if (error) throw new Error(error);
      setMarisqueos(data || []);
    } catch (error) {
      console.error("Error loading marisqueos:", error);
      toast.error("Error al cargar los marisqueos");
    } finally {
      setIsLoadingMarisqueos(false);
    }
  }, [campania.id]);

  // Función optimizada para cargar cuadrados
  const loadCuadrados = useCallback(async () => {
    if (isLoadingCuadrados) return;

    setIsLoadingCuadrados(true);
    try {
      const { data, error } = await getCuadradosByCampaniaAction(campania.id);
      if (error) throw new Error(error);
      setCuadrados(data || []);
    } catch (error) {
      console.error("Error loading cuadrados:", error);
      toast.error("Error al cargar los cuadrados");
    } finally {
      setIsLoadingCuadrados(false);
    }
  }, [campania.id]);

  // Función optimizada para cargar segmentos
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

  // Handlers optimizados
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

    // Primero invalidar el cache
    setSegmentosCargados((prev) => {
      const next = { ...prev };
      transectaIds.forEach((id) => delete next[id]);
      return next;
    });

    // Luego forzar la recarga sin depender del cache
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
      // Primero actualizamos el estado local para respuesta inmediata
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

      // Luego forzar actualización completa para obtener datos frescos del servidor
      // con todas las relaciones correctas
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

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Efectos para carga lazy de pestañas
  useEffect(() => {
    if (
      activeTab === "marisqueos" &&
      marisqueos.length === 0 &&
      !isLoadingMarisqueos
    ) {
      loadMarisqueos();
    }
  }, [activeTab, marisqueos.length, loadMarisqueos]);

  useEffect(() => {
    if (
      activeTab === "cuadrados" &&
      cuadrados.length === 0 &&
      !isLoadingCuadrados
    ) {
      loadCuadrados();
    }
  }, [activeTab, cuadrados.length, loadCuadrados]);

  // Segmentos para el mapa - memoizados
  const segmentosParaMapa = useMemo(() => {
    return selectedTransectaId !== null &&
      segmentosCargados[selectedTransectaId]
      ? segmentosCargados[selectedTransectaId]
      : [];
  }, [selectedTransectaId, segmentosCargados]);

  return (
    <div id="campania-view" className="w-full min-h-0 h-full p-6 flex flex-col">
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

      <Tabs
        defaultValue="transectas"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        className="w-full flex-1 flex flex-col min-h-0"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="transectas">Transectas</TabsTrigger>
          <TabsTrigger value="marisqueos">Marisqueos</TabsTrigger>
          <TabsTrigger value="cuadrados">Cuadrados</TabsTrigger>
        </TabsList>

        <TabsContent
          value="transectas"
          className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
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
        </TabsContent>

        <TabsContent value="marisqueos" className="flex-1 min-h-0">
          <MarisqueosList
            marisqueos={marisqueos}
            isLoading={isLoadingMarisqueos}
            campaniaId={campania.id}
            onMarisqueoAdded={loadMarisqueos}
          />
        </TabsContent>

        <TabsContent value="cuadrados" className="flex-1">
          <CuadradosList
            cuadrados={cuadrados}
            isLoading={isLoadingCuadrados}
            campaniaId={campania.id}
            onCuadradoAdded={loadCuadrados}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
