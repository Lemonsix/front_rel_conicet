"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { aseguraCoordenada } from "@/lib/utils/coordinates";

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

  return (
    <Card
      className={cn(
        "cursor-pointer border border-transparent transition-colors ",
        isHovered ? "border-gray-400 shadow-md" : ""
      )}
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
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{transecta.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <div>
              <div>{transecta.horaInicio}</div>
              <div>{transecta.horaFin}</div>
            </div>
          </div>

          {transecta.embarcacion && (
            <div className="flex items-center text-sm text-muted-foreground">
              <AnchorIcon className="w-4 h-4 mr-2" />
              <span>{transecta.embarcacion.nombre}</span>
            </div>
          )}

          {transecta.buzo && (
            <div className="flex items-center text-sm text-muted-foreground">
              <UserIcon className="w-4 h-4 mr-2" />
              <span>
                {transecta.buzo.nombre} {transecta.buzo.apellido}
              </span>
            </div>
          )}

          <div className="flex items-center text-sm text-muted-foreground">
            <span>
              <Tally5Icon className="w-4 h-4 mr-2 inline" />
              {segmentCount} segmentos
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2"></div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">
            <MapPinIcon className="w-4 h-4 mr-2 inline" />
            Inicio:
            <div className="ml-6 truncate">
              {puntoInicioStr?.latitud.grados}°{" "}
              {puntoInicioStr?.latitud.minutos}'{" "}
              {puntoInicioStr?.latitud.segundos}"{" "}
              {puntoInicioStr?.latitud.direccion}
              {puntoInicioStr?.longitud.grados}°{" "}
              {puntoInicioStr?.longitud.minutos}'{" "}
              {puntoInicioStr?.longitud.segundos}"{" "}
              {puntoInicioStr?.longitud.direccion}
            </div>
            <ArrowDownFromLineIcon className="w-4 h-4 mr-2 inline" />
            Prof.: {transecta.profundidadInicial || "N/D"}m
          </div>

          <div className="text-sm text-muted-foreground mt-2">
            <MapPinIcon className="w-4 h-4 mr-2 inline" />
            Fin:
            <div className="ml-6 truncate">
              {puntoFinStr?.latitud.grados}° {puntoFinStr?.latitud.minutos}'{" "}
              {puntoFinStr?.latitud.segundos}" {puntoFinStr?.latitud.direccion}
              {puntoFinStr?.longitud.grados}° {puntoFinStr?.longitud.minutos}'{" "}
              {puntoFinStr?.longitud.segundos}"{" "}
              {puntoFinStr?.longitud.direccion}
            </div>
            <ArrowDownFromLineIcon className="w-4 h-4 mr-2 inline" />
            Prof.: {transecta.profundidadFinal || "N/D"}m
          </div>
        </div>
        <div className="flex flex-row items-end justify-end">
          {hasMarisqueo && <Badge variant="secondary">Marisqueo</Badge>}
          {hasCuadrados && <Badge variant="secondary">Cuadrados</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
