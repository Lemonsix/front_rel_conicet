"use client";

import { TransectasAccordion } from "@/components/transectas/transectas-accordion";
import { TransectaMap } from "@/components/map/transecta-map";
import { Campania } from "@/lib/types/campania";
import { Transecta } from "@/lib/types/transecta";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { parseWKTPoint } from "@/lib/utils/coordinates";

interface CampaniaViewProps {
  campania: Campania;
  transectas: Transecta[];
}

export function CampaniaView({
  campania,
  transectas: initialTransectas,
}: CampaniaViewProps) {
  const [transectasAbiertas, setTransectasAbiertas] = useState<Set<number>>(
    new Set()
  );
  const [transectas, setTransectas] = useState<Transecta[]>(initialTransectas);
  const supabase = createClient();

  // Obtener todos los segmentos de las transectas abiertas
  const segmentosVisibles = transectas
    .filter((t) => transectasAbiertas.has(t.id))
    .flatMap((t) => t.segmentos || [])
    .filter(Boolean);

  const handleTransectaOpen = (transectaId: number) => {
    setTransectasAbiertas((prev) => new Set([...prev, transectaId]));
  };

  const handleTransectaClose = (transectaId: number) => {
    setTransectasAbiertas((prev) => {
      const next = new Set(prev);
      next.delete(transectaId);
      return next;
    });
  };

  const handleSegmentoCreado = async () => {
    try {
      // Recargar los datos de las transectas
      const { data: transectasData, error } = await supabase
        .from("transectas")
        .select(
          `
          id,
          nombre,
          observaciones,
          fecha,
          hora_inicio,
          hora_fin,
          profundidad_inicial,
          orientacion,
          embarcacion_id,
          buzo_id,
          campania_id,
          embarcacion:embarcaciones!transectas_fk_embarcaciones(
            id,
            nombre,
            matricula
          ),
          buzo:personas!transectas_fk_buzo_personas(
            id,
            nombre,
            apellido,
            rol
          ),
          segmentos!inner(
            id,
            numero,
            largo,
            profundidad_inicial,
            profundidad_final,
            sustrato:sustratos!segmentos_fk_sustratos(
              id,
              codigo,
              descripcion
            ),
            conteo,
            est_minima,
            coordenadas_inicio,
            coordenadas_fin,
            tiene_marisqueo,
            tiene_cuadrados,
            marisqueos!marisqueos_fk_segmentos(
              id,
              segmento_id,
              timestamp,
              tiempo,
              coordenadas,
              tiene_muestreo,
              buzo_id,
              n_captura,
              peso_muestra
            ),
            cuadrados(
              id,
              segmento_id,
              replica,
              coordenadas_inicio,
              coordenadas_fin,
              profundidad_inicio,
              profundidad_fin,
              tiene_muestreo,
              conteo,
              tamanio,
              timestamp
            )
          )
        `
        )
        .eq("campania_id", campania.id);

      if (error) throw error;

      // Mapear los datos al formato correcto
      const mappedTransectas: Transecta[] = transectasData.map((t: any) => ({
        id: t.id,
        nombre: t.nombre,
        observaciones: t.observaciones,
        fecha: t.fecha,
        horaInicio: t.hora_inicio,
        horaFin: t.hora_fin,
        profundidadInicial: t.profundidad_inicial,
        orientacion: t.orientacion,
        embarcacionId: t.embarcacion_id,
        buzoId: t.buzo_id,
        campaniaId: t.campania_id,
        embarcacion: t.embarcacion?.[0],
        buzo: t.buzo?.[0],
        segmentos:
          t.segmentos?.map((s: any) => ({
            id: s.id,
            transectId: t.id,
            numero: s.numero,
            largo: s.largo,
            profundidadInicial: s.profundidad_inicial,
            profundidadFinal: s.profundidad_final,
            sustrato: s.sustrato[0],
            conteo: s.conteo,
            estMinima: s.est_minima || 0,
            tieneMarisqueo: s.tiene_marisqueo === "SI",
            tieneCuadrados: s.tiene_cuadrados === "SI",
            coordenadasInicio: s.coordenadas_inicio
              ? parseWKTPoint(s.coordenadas_inicio, s.profundidad_inicial)
              : undefined,
            coordenadasFin: s.coordenadas_fin
              ? parseWKTPoint(s.coordenadas_fin, s.profundidad_final)
              : undefined,
            marisqueos: s.marisqueos?.map((m: any) => ({
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
            cuadrados: s.cuadrados?.map((c: any) => ({
              id: c.id,
              segmentoId: c.segmento_id,
              replica: c.replica,
              coordenadasInicio: c.coordenadas_inicio,
              coordenadasFin: c.coordenadas_fin,
              profundidadInicio: c.profundidad_inicio,
              profundidadFin: c.profundidad_fin,
              tieneMuestreo: c.tiene_muestreo,
              conteo: c.conteo,
              tamanio: c.tamanio,
              timestamp: c.timestamp,
            })),
          })) || [],
      }));

      // Actualizar el estado con los datos mapeados
      setTransectas(mappedTransectas);
    } catch (error) {
      console.error("Error recargando transectas:", error);
      toast.error("Error al actualizar los datos");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-full p-6 overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          <h1 className="text-3xl font-bold mb-6">{campania.nombre}</h1>
          <p className="text-muted-foreground mb-6">{campania.observaciones}</p>
          <div className="flex-1 overflow-y-auto min-h-0">
            <TransectasAccordion
              transectas={transectas}
              onTransectaOpen={handleTransectaOpen}
              onTransectaClose={handleTransectaClose}
              onSegmentoCreado={handleSegmentoCreado}
            />
          </div>
        </div>
      </div>
      <div className="w-full h-full overflow-hidden">
        <TransectaMap segmentos={segmentosVisibles} />
      </div>
    </div>
  );
}
