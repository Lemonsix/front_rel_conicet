"use client";

import { useState, useEffect } from "react";
import { Transecta } from "@/lib/types/transecta";
import { Segmento } from "@/lib/types/segmento";
import { TransectaCard } from "./transecta-card";
import { TransectaDetails } from "./transecta-details";
import { TransectaMap } from "../map/transecta-map";

interface TransectasListProps {
  transectas: Transecta[];
  onTransectaOpen: (transectaId: number) => void;
  onTransectaClose: (transectaId: number) => void;
  onSegmentoCreado: () => void;
  segmentosCargados: Record<number, Segmento[]>;
  cargandoSegmentos: Record<number, boolean>;
}

export function TransectasList({
  transectas,
  onTransectaOpen,
  onTransectaClose,
  onSegmentoCreado,
  segmentosCargados,
  cargandoSegmentos,
}: TransectasListProps) {
  const [selectedTransectaId, setSelectedTransectaId] = useState<number | null>(
    null
  );
  const [hoveredTransectaId, setHoveredTransectaId] = useState<number | null>(
    null
  );
  const [mapSegmentos, setMapSegmentos] = useState<Segmento[]>([]);

  // When a transecta is hovered, update the map to show its beginning and end points
  /*  useEffect(() => {
    if (hoveredTransectaId === null) {
      // If no transecta is hovered, show all transectas on the map
      const allSegmentos: Segmento[] = [];
      Object.values(segmentosCargados).forEach((segmentos) => {
        if (segmentos && segmentos.length > 0) {
          // For each transecta, only add the first and last segment for the map
          const firstSegment = segmentos.find((s) => s.numero === 1);
          const lastSegment = [...segmentos].sort(
            (a, b) => b.numero - a.numero
          )[0];

          if (firstSegment) allSegmentos.push(firstSegment);
          if (lastSegment && lastSegment.id !== firstSegment?.id)
            allSegmentos.push(lastSegment);
        }
      });
      setMapSegmentos(allSegmentos);
    } else if (segmentosCargados[hoveredTransectaId]) {
      // If a transecta is hovered, only show its segments
      const segmentos = segmentosCargados[hoveredTransectaId] || [];

      // For the hovered transecta, we might want to show more detail
      // Here we're showing all segments for better visualization
      setMapSegmentos(segmentos);

      // Optional: Load segments if they haven't been loaded yet
      if (!segmentosCargados[hoveredTransectaId]) {
        onTransectaOpen(hoveredTransectaId);
      }
    }
  }, [hoveredTransectaId, segmentosCargados, onTransectaOpen]); */

  // Handle card click - show detail view for that transecta
  const handleCardClick = (transectaId: number) => {
    setSelectedTransectaId(transectaId);

    // Ensure segments are loaded
    if (!segmentosCargados[transectaId]) {
      onTransectaOpen(transectaId);
    }
  };

  // Calculate if a transecta has marisqueo or cuadrados
  const hasMarisqueo = (transectaId: number): boolean => {
    const segmentos = segmentosCargados[transectaId] || [];
    return segmentos.some((s) => s.tieneMarisqueo);
  };

  const hasCuadrados = (transectaId: number): boolean => {
    const segmentos = segmentosCargados[transectaId] || [];
    return segmentos.some((s) => s.tieneCuadrados);
  };

  // Go back to grid view
  const handleBack = () => {
    if (selectedTransectaId) {
      onTransectaClose(selectedTransectaId);
    }
    setSelectedTransectaId(null);
  };

  // If a transecta is selected, show its details
  if (selectedTransectaId !== null) {
    const selectedTransecta = transectas.find(
      (t) => t.id === selectedTransectaId
    );
    if (!selectedTransecta) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TransectaDetails
              transecta={selectedTransecta}
              segmentos={segmentosCargados[selectedTransectaId] || []}
              onBack={handleBack}
              onSegmentoCreado={onSegmentoCreado}
              isLoading={cargandoSegmentos[selectedTransectaId] || false}
            />
          </div>
          <div className="h-[500px] lg:h-auto">
            <TransectaMap
              segmentos={segmentosCargados[selectedTransectaId] || []}
            />
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show the list of transecta cards
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-4">
            {transectas.map((transecta) => (
              <TransectaCard
                key={transecta.id}
                transecta={transecta}
                onClick={() => handleCardClick(transecta.id)}
                onHover={setHoveredTransectaId}
                segmentCount={(segmentosCargados[transecta.id] || []).length}
                hasMarisqueo={hasMarisqueo(transecta.id)}
                hasCuadrados={hasCuadrados(transecta.id)}
              />
            ))}
          </div>
        </div>
        <div className="h-[500px] lg:h-auto">
          <TransectaMap segmentos={mapSegmentos} />
        </div>
      </div>
    </div>
  );
}
