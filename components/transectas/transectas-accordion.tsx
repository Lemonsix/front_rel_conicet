"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { mapSegmentos } from "@/lib/mappers/segmentos";
import { Segmento } from "@/lib/types/segmento";
import { Transecta } from "@/lib/types/transecta";
import { useState } from "react";
import { toast } from "sonner";
import { NuevoSegmentoForm } from "../segmentos/nuevo-segmento-form";
import { SegmentosTable } from "../segmentos/segmentos-table";

interface TransectasAccordionProps {
  transectas: Transecta[];
  onTransectaOpen: (transectaId: number) => void;
  onTransectaClose: (transectaId: number) => void;
  onSegmentoCreado: () => void;
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
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error("No se encontraron datos");
      }

      // Mapear los segmentos usando la función importada
      const segmentosMapeados = mapSegmentos(result.data);

      setSegmentosCargados((prev) => ({
        ...prev,
        [transectaId]: segmentosMapeados as Segmento[],
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
              <div
                className="flex justify-center items-center h-32"
                key={`loading-${transecta.id}`}
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div key={`content-${transecta.id}`}>
                <div className="flex justify-end mb-4">
                  <NuevoSegmentoForm
                    transectaId={transecta.id}
                    onSuccess={onSegmentoCreado}
                  />
                </div>
                <SegmentosTable
                  segmentos={segmentosCargados[transecta.id] || []}
                  onSegmentoCreado={onSegmentoCreado}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
