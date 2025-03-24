"use client";

import { TransectasAccordion } from "@/components/transectas/transectas-accordion";
import { TransectaMap } from "@/components/map/transecta-map";
import { Campania } from "@/lib/types/campania";
import { Transecta } from "@/lib/types/transecta";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { parseWKTPoint } from "@/lib/utils/coordinates";
import { getTransectasByCampaniaAction } from "@/lib/actions/transectas";
import { TransectaModal } from "./transecta-modal";
import { getEmbarcacionesAction } from "@/lib/actions/embarcaciones";
import { getPersonasByRolAction } from "@/lib/actions/personas";

interface CampaniaViewProps {
  campania: Campania;
  transectas: Transecta[];
}

// Interfaces para los datos que vienen de Supabase
interface TransectaData {
  id: number;
  nombre: string;
  observaciones?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  profundidad_inicial: number;
  orientacion: string;
  embarcacion_id?: number;
  buzo_id?: number;
  campania_id: number;
  embarcacion?: Array<{
    id: number;
    nombre: string;
    matricula: string;
  }>;
  buzo?: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }>;
  segmentos?: Array<{
    id: number;
    numero: number;
    largo: number;
    profundidad_inicial: number;
    profundidad_final: number;
    sustrato: Array<{
      id: number;
      codigo: string;
      descripcion: string;
    }>;
    conteo: number;
    est_minima: number;
    coordenadas_inicio: string;
    coordenadas_fin: string;
    tiene_marisqueo: string;
    tiene_cuadrados: string;
    marisqueos?: Array<{
      id: number;
      segmento_id: number;
      timestamp: string;
      tiempo: number;
      coordenadas: string;
      tiene_muestreo: boolean;
      buzo_id: number;
      n_captura: number;
      peso_muestra: number;
    }>;
    cuadrados?: Array<{
      id: number;
      segmento_id: number;
      replica: number;
      coordenadas_inicio: string;
      coordenadas_fin: string;
      profundidad_inicio: number;
      profundidad_fin: number;
      tiene_muestreo: boolean;
      conteo: number;
      tamanio: number;
      timestamp: string;
    }>;
  }>;
}

export function CampaniaView({
  campania,
  transectas: initialTransectas,
}: CampaniaViewProps) {
  const [transectasAbiertas, setTransectasAbiertas] = useState<Set<number>>(
    new Set()
  );
  const [transectas, setTransectas] = useState<Transecta[]>(initialTransectas);
  const [embarcaciones, setEmbarcaciones] = useState<
    Array<{
      id: number;
      nombre: string;
      matricula: string;
    }>
  >([]);
  const [buzos, setBuzos] = useState<
    Array<{
      id: number;
      nombre: string;
      apellido: string;
      rol: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener embarcaciones
        const { data: embarcacionesData, error: embarcacionesError } =
          await getEmbarcacionesAction();
        if (embarcacionesError) throw new Error(embarcacionesError);
        setEmbarcaciones(embarcacionesData || []);

        // Obtener buzos
        const { data: buzosData, error: buzosError } =
          await getPersonasByRolAction("BUZO");
        if (buzosError) throw new Error(buzosError);
        setBuzos(
          (buzosData || []).map((buzo) => ({
            id: buzo.id,
            nombre: buzo.nombre,
            apellido: buzo.apellido,
            rol: "BUZO",
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Obtener todos los segmentos de las transectas abiertas
  const segmentosVisibles = transectas
    .filter((t) => transectasAbiertas.has(t.id))
    .flatMap((t) => t.segmentos || [])
    .filter(Boolean);

  const handleTransectaOpen = (transectaId: number) => {
    setTransectasAbiertas((prev) => new Set([...prev, transectaId]));
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
      const result = await getTransectasByCampaniaAction(campania.id);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error("No se encontraron datos");
      }

      // Validar que los datos sean del tipo correcto
      if (!Array.isArray(result.data)) {
        throw new Error("Los datos no tienen el formato esperado");
      }

      // Mapear los datos al formato correcto
      const mappedTransectas: Transecta[] = (
        result.data as unknown as TransectaData[]
      ).map((t) => ({
        id: t.id,
        nombre: t.nombre,
        observaciones: t.observaciones,
        fecha: t.fecha,
        horaInicio: t.hora_inicio,
        horaFin: t.hora_fin,
        profundidadInicial: t.profundidad_inicial,
        orientacion: t.orientacion,
        embarcacionId: t.embarcacion_id,
        buzoId: t.buzo_id,
        campaniaId: t.campania_id,
        embarcacion: t.embarcacion?.[0],
        buzo: t.buzo?.[0],
        segmentos:
          t.segmentos?.map((s) => ({
            id: s.id,
            transectId: t.id,
            numero: s.numero,
            largo: s.largo,
            profundidadInicial: s.profundidad_inicial,
            profundidadFinal: s.profundidad_final,
            sustrato: s.sustrato[0],
            conteo: s.conteo,
            estMinima: s.est_minima || 0,
            tieneMarisqueo: s.tiene_marisqueo === "SI",
            tieneCuadrados: s.tiene_cuadrados === "SI",
            coordenadasInicio: s.coordenadas_inicio
              ? parseWKTPoint(s.coordenadas_inicio, s.profundidad_inicial)
              : undefined,
            coordenadasFin: s.coordenadas_fin
              ? parseWKTPoint(s.coordenadas_fin, s.profundidad_final)
              : undefined,
            marisqueos: s.marisqueos?.map((m) => ({
              id: m.id,
              segmentoId: m.segmento_id,
              timestamp: m.timestamp,
              tiempo: m.tiempo,
              coordenadas: m.coordenadas,
              tieneMuestreo: m.tiene_muestreo,
              buzoId: m.buzo_id,
              NroCaptura: m.n_captura,
              PesoMuestra: m.peso_muestra,
            })),
            cuadrados: s.cuadrados?.map((c) => ({
              id: c.id,
              segmentoId: c.segmento_id,
              replica: c.replica,
              coordenadasInicio: c.coordenadas_inicio,
              coordenadasFin: c.coordenadas_fin,
              profundidadInicio: c.profundidad_inicio.toString(),
              profundidadFin: c.profundidad_fin.toString(),
              tieneMuestreo: c.tiene_muestreo,
              conteo: c.conteo,
              tamanio: c.tamanio,
              timestamp: c.timestamp,
            })),
          })) || [],
      }));

      // Actualizar el estado con los datos mapeados
      setTransectas(mappedTransectas);
    } catch (error) {
      console.error("Error recargando transectas:", error);
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
