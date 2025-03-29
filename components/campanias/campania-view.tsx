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

export function CampaniaView({ campania }: CampaniaViewProps) {
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState<string>("transectas");

  const [transectasAbiertas, setTransectasAbiertas] = useState<Set<number>>(
    new Set()
  );

  // Función de utilidad para ordenar transectas numéricamente por nombre
  const ordenarTransectas = (transectas: Transecta[]): Transecta[] => {
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return [...transectas].sort((a, b) => collator.compare(a.nombre, b.nombre));
  };

  const [transectas, setTransectas] = useState<Transecta[]>(
    ordenarTransectas(campania.transectas || [])
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

  // Estados para marisqueos y cuadrados
  const [marisqueos, setMarisqueos] = useState<Marisqueo[]>([]);
  const [cuadrados, setCuadrados] = useState<Cuadrado[]>([]);
  const [isLoadingMarisqueos, setIsLoadingMarisqueos] = useState(false);
  const [isLoadingCuadrados, setIsLoadingCuadrados] = useState(false);

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
          setTransectas(ordenarTransectas(transectasMapeadas));
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

  // Cargar marisqueos cuando se selecciona la pestaña correspondiente
  useEffect(() => {
    if (
      activeTab === "marisqueos" &&
      marisqueos.length === 0 &&
      !isLoadingMarisqueos
    ) {
      loadMarisqueos();
    }
  }, [activeTab, marisqueos.length]);

  // Cargar cuadrados cuando se selecciona la pestaña correspondiente
  useEffect(() => {
    if (
      activeTab === "cuadrados" &&
      cuadrados.length === 0 &&
      !isLoadingCuadrados
    ) {
      loadCuadrados();
    }
  }, [activeTab, cuadrados.length]);

  const loadMarisqueos = async () => {
    setIsLoadingMarisqueos(true);
    try {
      const { data, error } = await getMarisqueosByCampaniaAction(campania.id);
      if (error) {
        throw new Error(error);
      }
      setMarisqueos(data || []);
    } catch (error) {
      console.error("Error cargando marisqueos:", error);
      toast.error("Error al cargar los marisqueos");
    } finally {
      setIsLoadingMarisqueos(false);
    }
  };

  const loadCuadrados = async () => {
    setIsLoadingCuadrados(true);
    try {
      const { data, error } = await getCuadradosByCampaniaAction(campania.id);
      if (error) {
        throw new Error(error);
      }
      setCuadrados(data || []);
    } catch (error) {
      console.error("Error cargando cuadrados:", error);
      toast.error("Error al cargar los cuadrados");
    } finally {
      setIsLoadingCuadrados(false);
    }
  };

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
    setIsLoading(true);
    try {
      const { data: transectasData, error: transectasError } =
        await getTransectasByCampaniaAction(campania.id);

      if (transectasError) throw new Error(transectasError);

      if (transectasData) {
        const transectasMapeadas = mapTransectas(transectasData);
        setTransectas(ordenarTransectas(transectasMapeadas));

        // Also refresh any loaded segments for existing transectas
        if (transectasAbiertas.size > 0) {
          await Promise.all(
            Array.from(transectasAbiertas).map(async (transectaId) => {
              await handleTransectaOpen(transectaId);
            })
          );
        }

        toast.success("Transectas actualizadas correctamente");
      }
    } catch (error) {
      console.error("Error refreshing transectas:", error);
      toast.error("Error al actualizar las transectas");
    } finally {
      setIsLoading(false);
    }
  };

  // Get map segments for the selected transecta
  const segmentosParaMapa =
    selectedTransectaId !== null && segmentosCargados[selectedTransectaId]
      ? segmentosCargados[selectedTransectaId]
      : [];

  return (
    <div
      id="campania-view"
      className="w-full min-h-0 h-full overflow-hidden p-6 flex flex-col"
    >
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
        onValueChange={setActiveTab}
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
          <div className="max-h-full flex-1 overflow-clip grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
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
            <div className="h-auto">
              <TransectaMap segmentos={segmentosParaMapa} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marisqueos" className="flex-1 min-h-0">
          <MarisqueosList
            marisqueos={marisqueos}
            isLoading={isLoadingMarisqueos}
          />
        </TabsContent>

        <TabsContent value="cuadrados" className="flex-1 min-h-0">
          <CuadradosList cuadrados={cuadrados} isLoading={isLoadingCuadrados} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
