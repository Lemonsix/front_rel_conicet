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
import { Edit, ArrowLeft } from "lucide-react";
import { useState } from "react";

import { NuevoSegmentoForm } from "../segmentos/nuevo-segmento-form";
import { SegmentosTable } from "../segmentos/segmentos-table";
import { EditarTransectaForm } from "./transecta-form";

interface TransectaDetailsProps {
  transecta: Transecta;
  segmentos: Segmento[];
  embarcaciones: Array<{
    id: number;
    nombre: string;
    matricula: string;
  }>;
  buzos: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }>;
  onBack: () => void;
  onSegmentoCreado: () => void;
  onTransectaUpdated: () => void;
  isLoading: boolean;
}

export function TransectaDetails({
  transecta,
  segmentos,
  embarcaciones,
  buzos,
  onBack,
  onSegmentoCreado,
  onTransectaUpdated,
  isLoading,
}: TransectaDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Check if any segmento has marisqueo or cuadrados
  const hasMarisqueo = segmentos.some((seg) => seg.tieneMarisqueo);
  const hasCuadrados = segmentos.some((seg) => seg.tieneCuadrados);

  // Formatear fecha y horas de forma segura
  const fechaFormatted =
    transecta.fecha || safeGetDate(transecta.fecha) || "Fecha N/D";
  const horaInicioFormatted = transecta.horaInicio || "";
  const horaFinFormatted = transecta.horaFin || "";

  const handleEditSuccess = () => {
    setIsEditing(false);
    onTransectaUpdated();
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleEditCancel}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h2 className="text-xl font-semibold">Editar transecta</h2>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Editar información de la transecta</CardTitle>
            <CardDescription>
              Modifica los datos de la transecta {transecta.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditarTransectaForm
              campaniaId={transecta.campaniaId!}
              transecta={transecta}
              embarcaciones={embarcaciones}
              buzos={buzos}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Información de la transecta</CardTitle>
              <CardDescription>
                {fechaFormatted} ({horaInicioFormatted} - {horaFinFormatted})
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
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
