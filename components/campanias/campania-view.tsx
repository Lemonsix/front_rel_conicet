"use client";

import { TransectasAccordion } from "@/components/transectas/transectas-accordion";
import { TransectaMap } from "@/components/map/transecta-map";
import { Campania } from "@/lib/types/campania";
import { Transecta } from "@/lib/types/transecta";

interface CampaniaViewProps {
  campania: Campania;
  transectas: Transecta[];
}

export function CampaniaView({ campania, transectas }: CampaniaViewProps) {
  // Obtener todos los segmentos de todas las transectas
  const todosLosSegmentos = transectas.flatMap((t) => t.segmentos);

  return (
    <div className="grid grid-cols-2 gap-4 w-full h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-full p-6 overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          <h1 className="text-3xl font-bold mb-6">{campania.nombre}</h1>
          <p className="text-muted-foreground mb-6">{campania.observaciones}</p>
          <div className="flex-1 overflow-y-auto min-h-0">
            <TransectasAccordion transectas={transectas} />
          </div>
        </div>
      </div>
      <div className="w-full h-full overflow-hidden">
        <TransectaMap segmentos={todosLosSegmentos} />
      </div>
    </div>
  );
}
