"use client"

import { Transecta } from "@/lib/types/transecta"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TransectasAccordionProps {
  transectas: Transecta[]
}

export function TransectasAccordion({ transectas }: TransectasAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {transectas.map((transecta) => (
        <AccordionItem key={transecta.id} value={`transecta-${transecta.id}`}>
          <AccordionTrigger className="text-left">
            <div className="flex flex-col items-start">
              <span className="font-semibold">{transecta.nombre}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(transecta.fecha), "dd 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {transecta.descripcion}
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">Segmentos:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {transecta.segmentos.map((segmento) => (
                    <li key={segmento.id} className="text-sm">
                      {segmento.nombre}
                      <span className="text-muted-foreground ml-2">
                        ({segmento.waypoints.length} waypoints)
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
  )
} 