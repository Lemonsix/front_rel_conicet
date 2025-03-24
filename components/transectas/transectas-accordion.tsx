"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { Segmento } from "@/lib/types/segmento";
import { Transecta } from "@/lib/types/transecta";
import { parseGeoJSONPoint } from "@/lib/utils/gps";
import { useState } from "react";
import { toast } from "sonner";
import { SegmentosTable } from "../segmentos/segmentos-table";
import { fromTheme } from "tailwind-merge";

interface TransectasAccordionProps {
  transectas: Transecta[];
  onTransectaOpen: (transectaId: number) => void;
  onTransectaClose: (transectaId: number) => void;
  onSegmentoCreado: () => void;
}

interface SegmentoData {
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
}

export function TransectasAccordion({
  transectas,
  onTransectaOpen,
  onTransectaClose,
  onSegmentoCreado,
}: TransectasAccordionProps) {
  const [segmentosCargados, setSegmentosCargados] = useState<
    Record<number, Segmento[]>
  >({});
  const [cargando, setCargando] = useState<Record<number, boolean>>({});

  const handleTransectaOpen = async (transectaId: number) => {
    onTransectaOpen(transectaId);

    // Si ya tenemos los segmentos cargados, no los volvemos a cargar
    if (segmentosCargados[transectaId]) {
      console.log(
        "Segmentos ya cargados para transecta",
        transectaId,
        segmentosCargados[transectaId]
      );
      return;
    }

    setCargando((prev) => ({ ...prev, [transectaId]: true }));
    try {
      const result = await getSegmentosByTransectaAction(transectaId);
      console.log("Result:", result);
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error("No se encontraron datos");
      }

      // Mapear los segmentos al formato correcto
      const segmentosMapeados: Segmento[] = (
        result.data as unknown as SegmentoData[]
      ).map((s) => {
        const rawCoordsInicio = s.coordenadas_inicio
          ? parseGeoJSONPoint(s.coordenadas_inicio, s.profundidad_inicial)
          : undefined;

        const rawCoordsFin = s.coordenadas_fin
          ? parseGeoJSONPoint(s.coordenadas_fin, s.profundidad_final)
          : undefined;

        // Convertir al formato Waypoint requerido
        const coordenadasInicio = rawCoordsInicio
          ? {
              latitud: rawCoordsInicio.lat,
              longitud: rawCoordsInicio.lng,
              profundidad: rawCoordsInicio.depth,
            }
          : {
              latitud: 0,
              longitud: 0,
              profundidad: s.profundidad_inicial || 0,
            };

        const coordenadasFin = rawCoordsFin
          ? {
              latitud: rawCoordsFin.lat,
              longitud: rawCoordsFin.lng,
              profundidad: rawCoordsFin.depth,
            }
          : {
              latitud: 0,
              longitud: 0,
              profundidad: s.profundidad_final || 0,
            };

        const segmento = {
          id: s.id,
          transectId: transectaId,
          numero: s.numero,
          largo: s.largo,
          profundidadInicial: s.profundidad_inicial,
          profundidadFinal: s.profundidad_final,
          sustrato: s.sustrato?.[0] ?? null,
          conteo: s.conteo,
          estMinima: s.est_minima || 0,
          tieneMarisqueo: s.tiene_marisqueo === "SI",
          tieneCuadrados: s.tiene_cuadrados === "SI",
          coordenadasInicio: s.coordenadasInicio,
          coordenadasFin: s.coordenadasFin,
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
        };

        console.log("Segmento mapeado:", segmento);
        return segmento;
      });

      console.log("Segmentos mapeados:", segmentosMapeados);

      setSegmentosCargados((prev) => ({
        ...prev,
        [transectaId]: segmentosMapeados,
      }));
    } catch (error) {
      console.error("Error cargando segmentos:", error);
      toast.error("Error al cargar los segmentos");
    } finally {
      setCargando((prev) => ({ ...prev, [transectaId]: false }));
    }
  };

  const handleTransectaClose = (transectaId: number) => {
    onTransectaClose(transectaId);
  };

  return (
    <Accordion
      type="multiple"
      className="w-full"
      onValueChange={(value) => {
        // Cuando se abre una transecta
        value.forEach((v) => {
          const transectaId = parseInt(v);
          if (!isNaN(transectaId)) {
            handleTransectaOpen(transectaId);
          }
        });

        // Cuando se cierra una transecta
        transectas.forEach((t) => {
          const transectaId = t.id.toString();
          if (!value.includes(transectaId)) {
            handleTransectaClose(t.id);
          }
        });
      }}
    >
      {transectas.map((transecta) => (
        <AccordionItem key={transecta.id} value={transecta.id.toString()}>
          <AccordionTrigger>
            <div className="flex flex-col items-start">
              <span className="font-semibold">{transecta.nombre}</span>
              <span className="text-sm text-muted-foreground">
                {transecta.fecha} - {transecta.horaInicio} a {transecta.horaFin}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {cargando[transecta.id] ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <SegmentosTable
                segmentos={segmentosCargados[transecta.id] || []}
                onSegmentoCreado={onSegmentoCreado}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
