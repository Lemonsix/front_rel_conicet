"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Transecta } from "@/lib/types/transecta";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  AnchorIcon,
  UserIcon,
  MapPinIcon,
  ArrowDownFromLineIcon,
  Tally5Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransectaCardProps {
  transecta: Transecta;
  onClick: () => void;
  onHover: (transectaId: number | null) => void;
  segmentCount: number;
  hasMarisqueo: boolean;
  hasCuadrados: boolean;
}

export function TransectaCard({
  transecta,
  onClick,
  onHover,
  segmentCount,
  hasMarisqueo,
  hasCuadrados,
}: TransectaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Format coordinates for display
  const puntoInicioStr = transecta.puntoInicio?.sexagesimal;
  const puntoFinStr = transecta.puntoFin?.sexagesimal;

  // Formatear horas de forma segura - ya vienen procesadas del mapper
  const horaInicioFormatted = transecta.horaInicio || "N/D";
  const horaFinFormatted = transecta.horaFin || "N/D";

  return (
    <Card
      className="cursor-pointer border border-transparent transition-colors w-full hover:border-gray-400 hover:shadow-md"
      onMouseEnter={() => {
        setIsHovered(true);
        onHover(transecta.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover(null);
      }}
      onClick={onClick}
    >
      <CardContent className="flex flex-row items-start py-3 gap-2 max-w-full">
        {/* Section 1: Transecta Name */}
        <div className="min-w-[120px] max-w-[150px] flex-shrink-0">
          <h3 className="font-medium text-lg truncate">{transecta.nombre}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {hasMarisqueo && (
              <Badge variant="secondary" className="text-xs">
                Marisqueo
              </Badge>
            )}
            {hasCuadrados && (
              <Badge variant="secondary" className="text-xs">
                Cuadrados
              </Badge>
            )}
          </div>
        </div>

        {/* Section 2: Metadata */}
        <div className="min-w-[150px] max-w-[180px] flex-shrink-0 space-y-1">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">
              {horaInicioFormatted} - {horaFinFormatted}
            </span>
          </div>

          {transecta.embarcacion && (
            <div className="flex items-center text-sm text-muted-foreground">
              <AnchorIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate">{transecta.embarcacion.nombre}</span>
            </div>
          )}

          {transecta.buzo && (
            <div className="flex items-center text-sm text-muted-foreground">
              <UserIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {transecta.buzo.nombre} {transecta.buzo.apellido}
              </span>
            </div>
          )}

          <div className="flex items-center text-sm text-muted-foreground">
            <Tally5Icon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span>{segmentCount} segmentos</span>
          </div>
        </div>

        {/* Section 3: Coordinates */}
        <div className="flex-1 min-w-0 max-w-full space-y-1 text-xs text-muted-foreground">
          <div className="flex items-start">
            <MapPinIcon className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 max-w-full">
              <span className="font-medium">Inicio: </span>
              <div className="flex flex-col">
                <span className="truncate">
                  {puntoInicioStr?.latitud.grados}°
                  {puntoInicioStr?.latitud.minutos}'
                  {puntoInicioStr?.latitud.segundos}"
                  {puntoInicioStr?.latitud.direccion} /
                  {puntoInicioStr?.longitud.grados}°
                  {puntoInicioStr?.longitud.minutos}'
                  {puntoInicioStr?.longitud.segundos}"
                  {puntoInicioStr?.longitud.direccion}
                </span>
                <span className="flex items-center">
                  <ArrowDownFromLineIcon className="w-3 h-3 mr-1 inline flex-shrink-0" />
                  Prof.: {transecta.profundidadInicial || "N/D"}m
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <MapPinIcon className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 max-w-full">
              <span className="font-medium">Fin: </span>
              <div className="flex flex-col">
                <span className="truncate">
                  {puntoFinStr?.latitud.grados}°{puntoFinStr?.latitud.minutos}'
                  {puntoFinStr?.latitud.segundos}"
                  {puntoFinStr?.latitud.direccion} /
                  {puntoFinStr?.longitud.grados}°{puntoFinStr?.longitud.minutos}
                  '{puntoFinStr?.longitud.segundos}"
                  {puntoFinStr?.longitud.direccion}
                </span>
                <span className="flex items-center">
                  <ArrowDownFromLineIcon className="w-3 h-3 mr-1 inline flex-shrink-0" />
                  Prof.: {transecta.profundidadFinal || "N/D"}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
