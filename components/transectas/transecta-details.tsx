"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Segmento } from "@/lib/types/segmento";
import { Transecta } from "@/lib/types/transecta";
import { safeGetTime, safeGetDate } from "@/lib/utils/datetime";
import { ArrowLeft } from "lucide-react";
import { NuevoSegmentoForm } from "../segmentos/nuevo-segmento-form";
import { SegmentosTable } from "../segmentos/segmentos-table";

interface TransectaDetailsProps {
  transecta: Transecta;
  segmentos: Segmento[];
  onBack: () => void;
  onSegmentoCreado: () => void;
  isLoading: boolean;
}

export function TransectaDetails({
  transecta,
  segmentos,
  onBack,
  onSegmentoCreado,
  isLoading,
}: TransectaDetailsProps) {
  // Check if any segmento has marisqueo or cuadrados
  const hasMarisqueo = segmentos.some((seg) => seg.tieneMarisqueo);
  const hasCuadrados = segmentos.some((seg) => seg.tieneCuadrados);

  // Formatear fecha y horas de forma segura
  const fechaFormatted =
    transecta.fecha || safeGetDate(transecta.fecha) || "Fecha N/D";
  const horaInicioFormatted = transecta.horaInicio || "";
  const horaFinFormatted = transecta.horaFin || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a lista
        </Button>
        <h2 className="text-xl font-bold">{transecta.nombre}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la transecta</CardTitle>
          <CardDescription>
            {fechaFormatted} ({horaInicioFormatted} - {horaFinFormatted})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Orientación:</p>
              <p className="text-sm">
                {transecta.sentido || "No especificada"}
              </p>
            </div>
            {transecta.profundidadInicial !== undefined && (
              <div>
                <p className="text-sm font-medium">Profundidad inicial:</p>
                <p className="text-sm">{transecta.profundidadInicial}m</p>
              </div>
            )}

            {transecta.embarcacion && (
              <div>
                <p className="text-sm font-medium">Embarcación:</p>
                <p className="text-sm">{transecta.embarcacion.nombre}</p>
              </div>
            )}
            {transecta.buzo && (
              <div>
                <p className="text-sm font-medium">Buzo:</p>
                <p className="text-sm">
                  {transecta.buzo.nombre} {transecta.buzo.apellido}
                </p>
              </div>
            )}
            {transecta.largoManguera && (
              <div>
                <p className="text-sm font-medium">Largo de manguera:</p>
                <p className="text-sm">{transecta.largoManguera}m</p>
              </div>
            )}
            {transecta.observaciones && (
              <div className="col-span-2">
                <p className="text-sm font-medium">Observaciones:</p>
                <p className="text-sm">{transecta.observaciones}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-4">
        <NuevoSegmentoForm
          transectaId={transecta.id}
          onSuccess={onSegmentoCreado}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <SegmentosTable
          segmentos={segmentos}
          onSegmentoCreado={onSegmentoCreado}
        />
      )}
    </div>
  );
}
