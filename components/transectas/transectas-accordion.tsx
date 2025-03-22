"use client";

import { Transecta } from "@/lib/types/transecta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface TransectasAccordionProps {
  transectas: Transecta[];
}

export function TransectasAccordion({ transectas }: TransectasAccordionProps) {
  const formatFecha = (fecha: Date | string) => {
    try {
      // Si es un objeto Date, convertirlo a string ISO
      const isoString = fecha instanceof Date ? fecha.toISOString() : fecha;
      // Parsear el string ISO y formatear
      return format(parseISO(isoString), "dd 'de' MMMM 'de' yyyy", {
        locale: es,
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Fecha inválida";
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {transectas.map((transecta) => (
        <AccordionItem key={transecta.id} value={`transecta-${transecta.id}`}>
          <AccordionTrigger className="text-left">
            <div className="flex flex-col items-start">
              <span className="font-semibold">{transecta.nombre}</span>
              <span className="text-sm text-muted-foreground">
                {formatFecha(transecta.fecha)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {transecta.observaciones}
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">Segmentos:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {transecta.segmentos?.map((segmento) => (
                    <li key={segmento.id} className="text-sm">
                      {segmento.numero}
                      <span className="text-muted-foreground ml-2">
                        ({segmento.waypoints?.length} waypoints)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
