"use client";

import { useState, useCallback } from "react";
import { Transecta } from "@/lib/types/transecta";
import { Segmento } from "@/lib/types/segmento";
import { TransectaCard } from "./transecta-card";
import { TransectaDetails } from "./transecta-details";

interface TransectasListProps {
  transectas: Transecta[];
  onTransectaOpen: (transectaId: number) => void;
  onTransectaClose: (transectaId: number) => void;
  onSegmentoCreado: () => void;
  segmentosCargados: Record<number, Segmento[]>;
  cargandoSegmentos: Record<number, boolean>;
  onTransectaSelect: (transectaId: number | null) => void;
}

export function TransectasList({
  transectas,
  onTransectaOpen,
  onTransectaClose,
  onSegmentoCreado,
  segmentosCargados,
  cargandoSegmentos,
  onTransectaSelect,
}: TransectasListProps) {
  const [selectedTransectaId, setSelectedTransectaId] = useState<number | null>(
    null
  );

  // Memoize handler functions to avoid recreating on every render
  const handleCardClick = useCallback(
    (transectaId: number) => {
      setSelectedTransectaId(transectaId);
      onTransectaSelect(transectaId);

      // Ensure segments are loaded
      if (!segmentosCargados[transectaId]) {
        onTransectaOpen(transectaId);
      }
    },
    [segmentosCargados, onTransectaOpen, onTransectaSelect]
  );

  // Memoize these functions to avoid recalculation on every render
  const hasMarisqueo = useCallback(
    (transectaId: number): boolean => {
      const segmentos = segmentosCargados[transectaId] || [];
      return segmentos.some((s) => s.tieneMarisqueo);
    },
    [segmentosCargados]
  );

  const hasCuadrados = useCallback(
    (transectaId: number): boolean => {
      const segmentos = segmentosCargados[transectaId] || [];
      return segmentos.some((s) => s.tieneCuadrados);
    },
    [segmentosCargados]
  );

  // Go back to grid view
  const handleBack = useCallback(() => {
    if (selectedTransectaId) {
      onTransectaClose(selectedTransectaId);
    }
    setSelectedTransectaId(null);
    onTransectaSelect(null);
  }, [selectedTransectaId, onTransectaClose, onTransectaSelect]);

  // If a transecta is selected, show its details
  if (selectedTransectaId !== null) {
    const selectedTransecta = transectas.find(
      (t) => t.id === selectedTransectaId
    );
    if (!selectedTransecta) return null;

    return (
      <div className="h-full min-h-0 overflow-y-scroll overflow-x-hidden">
        <div className="pb-8">
          <TransectaDetails
            transecta={selectedTransecta}
            segmentos={segmentosCargados[selectedTransectaId] || []}
            onBack={handleBack}
            onSegmentoCreado={onSegmentoCreado}
            isLoading={cargandoSegmentos[selectedTransectaId] || false}
          />
        </div>
      </div>
    );
  }

  // Otherwise show the list of transecta cards
  return (
    <div className="h-full min-h-0 overflow-y-scroll overflow-x-hidden pr-1">
      <div className="flex flex-col gap-4 pb-4 w-full">
        {transectas.map((transecta) => (
          <TransectaCard
            key={transecta.id}
            transecta={transecta}
            onClick={() => handleCardClick(transecta.id)}
            onHover={onTransectaSelect}
            segmentCount={(segmentosCargados[transecta.id] || []).length}
            hasMarisqueo={hasMarisqueo(transecta.id)}
            hasCuadrados={hasCuadrados(transecta.id)}
          />
        ))}
      </div>
    </div>
  );
}
