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
import { formatCoordinates } from "@/lib/utils/coordinates";
import { NuevoSegmentoForm } from "@/components/segmentos/nuevo-segmento-form";

interface TransectasAccordionProps {
  transectas: Transecta[];
  onTransectaOpen?: (transectaId: number) => void;
  onTransectaClose?: (transectaId: number) => void;
  onSegmentoCreado?: () => void;
}

export function TransectasAccordion({
  transectas,
  onTransectaOpen,
  onTransectaClose,
  onSegmentoCreado,
}: TransectasAccordionProps) {
  const formatFecha = (fecha: Date | string) => {
    const date = typeof fecha === "string" ? parseISO(fecha) : fecha;
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const handleValueChange = (value: string | undefined) => {
    if (!value) {
      transectas.forEach((t) => onTransectaClose?.(t.id));
      return;
    }

    const transectaId = value.split("-")[1];
    if (transectaId) {
      transectas.forEach((t) => {
        if (t.id !== parseInt(transectaId)) {
          onTransectaClose?.(t.id);
        }
      });
      onTransectaOpen?.(parseInt(transectaId));
    }
  };

  return (
    <Accordion type="single" collapsible onValueChange={handleValueChange}>
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
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Observaciones: {transecta.observaciones}
                </p>
                <NuevoSegmentoForm
                  transectaId={transecta.id}
                  onSuccess={onSegmentoCreado}
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Segmentos:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {transecta.segmentos?.map((segmento) => {
                    return (
                      <li key={segmento.id} className="text-sm flex flex-col">
                        <div>Segmento {segmento.numero}</div>
                        <div className="text-muted-foreground ml-4 text-xs">
                          {!segmento.coordenadasInicio &&
                          !segmento.coordenadasFin ? (
                            <span>Sin coordenadas registradas</span>
                          ) : (
                            <>
                              {segmento.coordenadasInicio && (
                                <div>
                                  Inicio:{" "}
                                  {formatCoordinates(
                                    segmento.coordenadasInicio.latitud,
                                    segmento.coordenadasInicio.longitud
                                  )}
                                  {segmento.coordenadasInicio.profundidad &&
                                    ` Prof: ${segmento.coordenadasInicio.profundidad}m`}
                                </div>
                              )}
                              {segmento.coordenadasFin && (
                                <div>
                                  Fin:{" "}
                                  {formatCoordinates(
                                    segmento.coordenadasFin.latitud,
                                    segmento.coordenadasFin.longitud
                                  )}
                                  {segmento.coordenadasFin.profundidad &&
                                    ` Prof: ${segmento.coordenadasFin.profundidad}m`}
                                </div>
                              )}
                              {segmento.conteo && (
                                <div>Conteo: {segmento.conteo}</div>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
