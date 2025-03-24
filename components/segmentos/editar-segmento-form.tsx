"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Segmento } from "@/lib/types/segmento";
import {
  updateSegmentoAction,
  getSustratosAction,
  calcularDistanciaHaversine,
} from "@/lib/actions/segmentos";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Definir el esquema de validación
const formSchema = z.object({
  numero: z.number().min(1, "El número de segmento debe ser mayor a 0"),
  coordenadas_inicio: z.object({
    latitud: z.object({
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
    }),
    longitud: z.object({
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
    }),
  }),
  coordenadas_fin: z.object({
    latitud: z.object({
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
    }),
    longitud: z.object({
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
    }),
  }),
  profundidad_final: z
    .number()
    .min(0, "La profundidad debe ser mayor o igual a 0"),
  profundidad_inicial: z
    .number()
    .min(0, "La profundidad debe ser mayor o igual a 0")
    .optional(),
  conteo: z.number().min(0, "El conteo debe ser mayor o igual a 0"),
  sustratoId: z.string().min(1, "El sustrato es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditarSegmentoFormProps {
  segmento: Segmento;
  isOpen: boolean;
  onClose: () => void;
}

interface Sustrato {
  id: number;
  codigo: string;
  descripcion: string;
}

// Función para convertir coordenadas decimales a minutos y segundos
function decimalToDMS(decimal: number): { minutos: number; segundos: number } {
  const minutos = Math.floor(Math.abs(decimal) * 60);
  const segundos = (Math.abs(decimal) * 60 - minutos) * 60;
  return {
    minutos: Math.floor(minutos),
    segundos: Math.round(segundos * 100) / 100,
  };
}

export function EditarSegmentoForm({
  segmento,
  isOpen,
  onClose,
}: EditarSegmentoFormProps) {
  const [sustratos, setSustratos] = useState<Sustrato[]>([]);
  const [loading, setLoading] = useState(false);

  // Convertir las coordenadas del segmento a minutos y segundos
  const coordenadasInicio = segmento.coordenadasInicio
    ? {
        latitud: decimalToDMS(segmento.coordenadasInicio.latitud),
        longitud: decimalToDMS(segmento.coordenadasInicio.longitud),
      }
    : {
        latitud: { minutos: 0, segundos: 0 },
        longitud: { minutos: 0, segundos: 0 },
      };

  const coordenadasFin = segmento.coordenadasFin
    ? {
        latitud: decimalToDMS(segmento.coordenadasFin.latitud),
        longitud: decimalToDMS(segmento.coordenadasFin.longitud),
      }
    : {
        latitud: { minutos: 0, segundos: 0 },
        longitud: { minutos: 0, segundos: 0 },
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: segmento.numero,
      profundidad_final: segmento.coordenadasFin?.profundidad || 0,
      profundidad_inicial: segmento.coordenadasInicio?.profundidad || 0,
      conteo: segmento.conteo || 0,
      sustratoId: segmento.sustratoId?.toString() || "",
      coordenadas_inicio: coordenadasInicio,
      coordenadas_fin: coordenadasFin,
    },
  });

  useEffect(() => {
    const fetchSustratos = async () => {
      const result = await getSustratosAction();
      if (result.error) {
        toast.error("Error al cargar sustratos");
        return;
      }
      setSustratos(result.data || []);

      console.log("Sustrato ID del segmento:", segmento.sustratoId);
      console.log("Valor actual del form:", form.getValues("sustratoId"));

      // Establecer el valor del sustrato después de cargar los datos
      if (segmento.sustratoId) {
        form.setValue("sustratoId", segmento.sustratoId.toString());
        console.log("Valor después de setValue:", form.getValues("sustratoId"));
      }
    };
    fetchSustratos();
  }, [segmento.sustratoId, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Coordenadas con minutos y segundos editables (sin modificar los grados directamente)
      const latDecimal =
        ((segmento.coordenadasFin?.latitud ?? 0) < 0 ? -1 : 1) *
        (Math.abs(Math.floor(segmento.coordenadasFin?.latitud ?? 0)) +
          values.coordenadas_fin.latitud.minutos / 60 +
          values.coordenadas_fin.latitud.segundos / 3600);

      const lonDecimal =
        ((segmento.coordenadasFin?.longitud ?? 0) < 0 ? -1 : 1) *
        (Math.abs(Math.floor(segmento.coordenadasFin?.longitud ?? 0)) +
          values.coordenadas_fin.longitud.minutos / 60 +
          values.coordenadas_fin.longitud.segundos / 3600);

      // Crear el punto WKT para las coordenadas de fin
      const wktPointFin = `SRID=4326;POINT(${lonDecimal} ${latDecimal})`;

      // Calcular las coordenadas de inicio
      const latInicioDecimal =
        ((segmento.coordenadasInicio?.latitud ?? 0) < 0 ? -1 : 1) *
        (Math.abs(Math.floor(segmento.coordenadasInicio?.latitud ?? 0)) +
          values.coordenadas_inicio.latitud.minutos / 60 +
          values.coordenadas_inicio.latitud.segundos / 3600);

      const lonInicioDecimal =
        ((segmento.coordenadasInicio?.longitud ?? 0) < 0 ? -1 : 1) *
        (Math.abs(Math.floor(segmento.coordenadasInicio?.longitud ?? 0)) +
          values.coordenadas_inicio.longitud.minutos / 60 +
          values.coordenadas_inicio.longitud.segundos / 3600);

      const wktPointInicio = `SRID=4326;POINT(${lonInicioDecimal} ${latInicioDecimal})`;

      // Calcular el largo entre los puntos de inicio y fin
      const largo = await calcularDistanciaHaversine(
        latInicioDecimal,
        lonInicioDecimal,
        latDecimal,
        lonDecimal
      );

      await updateSegmentoAction({
        id: segmento.id,
        transecta_id: segmento.transectId,
        numero: values.numero,
        coordenadas_inicio: wktPointInicio,
        coordenadas_fin: wktPointFin,
        profundidad_final: values.profundidad_final,
        profundidad_inicial: values.profundidad_inicial || 0,
        sustrato_id: parseInt(values.sustratoId),
        conteo: values.conteo,
        distancia: largo,
        est_minima: 0,
      });

      toast.success("Segmento actualizado exitosamente");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el segmento"
      );
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Segmento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Segmento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sustratoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sustrato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sustrato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sustratos.map((sustrato) => (
                          <SelectItem
                            key={sustrato.id}
                            value={sustrato.id.toString()}
                          >
                            {`${sustrato.codigo} - ${sustrato.descripcion}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">
                      Debug: sustratoId={field.value}
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Punto de Inicio */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <FormLabel className="text-lg font-semibold">
                  Punto de Inicio
                </FormLabel>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                {/* Coordenadas de Inicio */}
                <div className="space-y-4">
                  {/* Latitud Inicio */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-medium">42°</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.latitud.minutos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              min
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">&apos;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.latitud.segundos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                className="w-24 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-nowrap">&quot;S</span>
                    </div>
                  </div>

                  {/* Longitud Inicio */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-medium">64°</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.longitud.minutos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              min
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">&apos;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.longitud.segundos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                className="w-24 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-nowrap">&quot;O</span>
                    </div>
                  </div>
                </div>

                {/* Profundidad Inicial */}
                <div className="flex flex-col justify-center">
                  <FormField
                    control={form.control}
                    name="profundidad_inicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidad Inicial</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ingrese la profundidad inicial"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-center">
                          metros
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Punto de Fin */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <FormLabel className="text-lg font-semibold">
                  Punto de Fin
                </FormLabel>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                {/* Coordenadas de Fin */}
                <div className="space-y-4">
                  {/* Latitud Fin */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-medium">42°</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.latitud.minutos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              min
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">&apos;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.latitud.segundos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                className="w-24 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-nowrap">&quot; S</span>
                    </div>
                  </div>

                  {/* Longitud Fin */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-medium">64°</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.longitud.minutos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              min
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">&apos;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.longitud.segundos"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                className="w-24 text-center"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-nowrap">&quot; O</span>
                    </div>
                  </div>
                </div>

                {/* Profundidad Final */}
                <div className="flex flex-col justify-center">
                  <FormField
                    control={form.control}
                    name="profundidad_final"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidad Final</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ingrese la profundidad final"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-center">
                          metros
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Conteo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conteo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ingrese el conteo"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
