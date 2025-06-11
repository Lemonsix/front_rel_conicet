"use client";

import { Campania } from "@/lib/types/campania";
import { Transecta } from "@/lib/types/transecta";
import { Segmento } from "@/lib/types/segmento";
import { TransectaMap } from "@/components/map/transecta-map";
import { TransectaDetails } from "@/components/transectas/transecta-details";

import { useState, useCallback } from "react";

interface TransectaDetailViewProps {
  campania: Campania;
  transecta: Transecta;
  segmentos: Segmento[];
}

export function TransectaDetailView({
  campania,
  transecta,
  segmentos: initialSegmentos,
}: TransectaDetailViewProps) {
  const [segmentos, setSegmentos] = useState<Segmento[]>(initialSegmentos);

  const handleSegmentoCreado = useCallback(() => {
    // En este caso, podríamos recargar la página o hacer una consulta fresh
    // Por ahora, mantenemos la funcionalidad básica
    window.location.reload();
  }, []);

  return (
    <div className="w-full h-full overflow-y-scroll grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Columna izquierda: Información y tabla de segmentos */}
      <div className="overflow-y-auto h-full min-h-0 pr-2">
        <TransectaDetails
          transecta={transecta}
          segmentos={segmentos}
          onBack={() => {}} // No necesario en esta vista
          onSegmentoCreado={handleSegmentoCreado}
          isLoading={false}
        />
      </div>

      {/* Columna derecha: Mapa - ocupa todo el espacio disponible */}
      <div className="h-full min-h-0 rounded-lg overflow-hidden border">
        <TransectaMap segmentos={segmentos} />
      </div>
    </div>
  );
}
