import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Segmento } from "@/lib/types/segmento";
import { ArrowDownFromLine, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { EditarSegmentoForm } from "./editar-segmento-form";
import {
  calcularDistanciaHaversine,
  formatCoordinates,
} from "@/lib/utils/coordinates";

interface SegmentosTableProps {
  segmentos: Segmento[];
  onSegmentoCreado?: () => void;
}

export function SegmentosTable({
  segmentos,
  onSegmentoCreado,
}: SegmentosTableProps) {
  const [segmentoAEditar, setSegmentoAEditar] = useState<Segmento | null>(null);
  const [distancias, setDistancias] = useState<Record<number, number>>({});

  useEffect(() => {
    const calcularDistancias = async () => {
      const nuevasDistancias: Record<number, number> = {};

      for (const segmento of segmentos) {
        if (segmento.coordenadasInicio && segmento.coordenadasFin) {
          const distancia = calcularDistanciaHaversine(
            segmento.coordenadasInicio.latitud,
            segmento.coordenadasInicio.longitud,
            segmento.coordenadasFin.latitud,
            segmento.coordenadasFin.longitud
          );
          nuevasDistancias[segmento.id] = distancia;
        }
      }

      setDistancias(nuevasDistancias);
    };

    calcularDistancias();
  }, [segmentos]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N</TableHead>
            <TableHead>
              <span className="flex items-center gap-2">
                <ArrowDownFromLine className="w-4 h-4" />
                Inicial
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-2">
                <ArrowDownFromLine className="w-4 h-4" />
                Final
              </span>
            </TableHead>
            <TableHead>Distancia</TableHead>
            <TableHead>Sustrato</TableHead>
            <TableHead>Conteo</TableHead>
            <TableHead>Est. Mínima</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {segmentos.map((segmento) => (
            <TableRow key={segmento.id}>
              <TableCell>{segmento.numero}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {segmento.coordenadasInicio ? (
                    <>
                      {segmento.coordenadasInicio.latitud !== 0 ||
                      segmento.coordenadasInicio.longitud !== 0 ? (
                        <>
                          <span className="text-xs">
                            {formatCoordinates(
                              segmento.coordenadasInicio.latitud,
                              0
                            )}
                          </span>
                          <span className="text-xs">
                            {formatCoordinates(
                              0,
                              segmento.coordenadasInicio.longitud
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sin coordenadas geográficas
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Prof:{" "}
                        {segmento.coordenadasInicio.profundidad !== undefined
                          ? segmento.coordenadasInicio.profundidad
                          : segmento.profundidadInicial || 0}
                        m
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        Sin coordenadas geográficas
                      </span>
                      {segmento.profundidadInicial !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          Prof: {segmento.profundidadInicial}m
                        </span>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {segmento.coordenadasFin ? (
                    <>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs">
                          {formatCoordinates(
                            segmento.coordenadasFin.latitud,
                            0
                          )}
                        </span>
                        <span className="text-xs">
                          {formatCoordinates(
                            0,
                            segmento.coordenadasFin.longitud
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Prof:{" "}
                        {segmento.coordenadasFin.profundidad !== undefined
                          ? segmento.coordenadasFin.profundidad
                          : segmento.profundidadFinal || 0}
                        m
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        Sin coordenadas geográficas
                      </span>
                      {segmento.profundidadFinal !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          Prof: {segmento.profundidadFinal}m
                        </span>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {distancias[segmento.id]
                  ? `${Math.round(distancias[segmento.id])}m`
                  : "-"}
              </TableCell>
              <TableCell>
                {segmento.sustrato ? (
                  <div className="relative group">
                    <span className="font-medium">
                      {segmento.sustrato.codigo}
                    </span>
                    <div className="absolute z-10 invisible opacity-0 p-2 bg-black text-white text-xs rounded w-max max-w-xs group-hover:opacity-100 group-hover:visible transition-opacity bottom-full mb-1">
                      {segmento.sustrato.descripcion}
                    </div>
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>{segmento.conteo}</TableCell>
              <TableCell>{segmento.estMinima}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSegmentoAEditar(segmento)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {segmentoAEditar && (
        <EditarSegmentoForm
          segmento={segmentoAEditar}
          isOpen={!!segmentoAEditar}
          onClose={() => setSegmentoAEditar(null)}
          onSuccess={onSegmentoCreado}
        />
      )}
    </>
  );
}
