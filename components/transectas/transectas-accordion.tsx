"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Segmento } from "@/lib/types/segmento";
import { Transecta } from "@/lib/types/transecta";
import { NuevoSegmentoForm } from "../segmentos/nuevo-segmento-form";
import { SegmentosTable } from "../segmentos/segmentos-table";

interface TransectasAccordionProps {
  transectas: Transecta[];
  onTransectaOpen: (transectaId: number) => void;
  onTransectaClose: (transectaId: number) => void;
  onSegmentoCreado: () => void;
  segmentosCargados: Record<number, Segmento[]>;
  cargandoSegmentos: Record<number, boolean>;
}

export function TransectasAccordion({
  transectas,
  onTransectaOpen,
  onTransectaClose,
  onSegmentoCreado,
  segmentosCargados,
  cargandoSegmentos,
}: TransectasAccordionProps) {
  return (
    <Accordion
      type="multiple"
      className="w-full"
      onValueChange={(value) => {
        // Cuando se abre una transecta
        value.forEach((v) => {
          const transectaId = parseInt(v);
          if (!isNaN(transectaId)) {
            onTransectaOpen(transectaId);
          }
        });

        // Cuando se cierra una transecta
        transectas.forEach((t) => {
          const transectaId = t.id.toString();
          if (!value.includes(transectaId)) {
            onTransectaClose(t.id);
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
            {cargandoSegmentos[transecta.id] ? (
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
