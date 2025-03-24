"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  calcularDistanciaHaversine,
  checkSegmentoNumberAvailabilityAction,
  createSegmentoAction,
  getSustratosAction,
  getUltimoSegmentoAction,
} from "@/lib/actions/segmentos";
import { Segmento } from "@/lib/types/segmento";
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

interface NuevoSegmentoFormProps {
  transectaId: number;
  onSuccess?: () => void;
}

interface Sustrato {
  id: number;
  codigo: string;
  descripcion: string;
}

export function NuevoSegmentoForm({
  transectaId,
  onSuccess,
}: NuevoSegmentoFormProps) {
  const [sustratos, setSustratos] = useState<Sustrato[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numeroDisponible, setNumeroDisponible] = useState(true);
  const [esPrimerSegmento, setEsPrimerSegmento] = useState(true);
  const [ultimoSegmento, setUltimoSegmento] = useState<Segmento | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: 1,
      coordenadas_inicio: {
        latitud: {
          minutos: 0,
          segundos: 0,
        },
        longitud: {
          minutos: 0,
          segundos: 0,
        },
      },
      coordenadas_fin: {
        latitud: {
          minutos: 0,
          segundos: 0,
        },
        longitud: {
          minutos: 0,
          segundos: 0,
        },
      },
      profundidad_final: 0,
      profundidad_inicial: 0,
      conteo: 0,
      sustratoId: "",
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
    };

    fetchSustratos();
  }, []);

  useEffect(() => {
    const checkPrimerSegmento = async () => {
      const result = await getUltimoSegmentoAction(transectaId);
      setEsPrimerSegmento(!result.data);
      if (result.data) {
        setUltimoSegmento(result.data);
      }
    };
    checkPrimerSegmento();
  }, [transectaId]);

  const checkNumeroDisponible = async (numero: number) => {
    const result = await checkSegmentoNumberAvailabilityAction(
      transectaId,
      numero
    );
    if (result.error) {
      toast.error("Error al verificar disponibilidad del número");
      return;
    }
    setNumeroDisponible(result.available ?? true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!numeroDisponible) {
      toast.error("El número de segmento ya está en uso");
      return;
    }

    setLoading(true);
    try {
      // Coordenadas fijas con minutos y segundos editables
      const latDecimal =
        -42 -
        values.coordenadas_fin.latitud.minutos / 60 -
        values.coordenadas_fin.latitud.segundos / 3600;
      const lonDecimal =
        -64 -
        values.coordenadas_fin.longitud.minutos / 60 -
        values.coordenadas_fin.longitud.segundos / 3600;

      // Crear el punto WKT para las coordenadas de fin
      const wktPointFin = `SRID=4326;POINT(${lonDecimal} ${latDecimal})`;

      let wktPointInicio: string;
      let largo = 0;

      if (esPrimerSegmento) {
        // Si es el primer segmento, calcular las coordenadas de inicio
        const latInicioDecimal =
          -42 -
          values.coordenadas_inicio.latitud.minutos / 60 -
          values.coordenadas_inicio.latitud.segundos / 3600;
        const lonInicioDecimal =
          -64 -
          values.coordenadas_inicio.longitud.minutos / 60 -
          values.coordenadas_inicio.longitud.segundos / 3600;

        wktPointInicio = `SRID=4326;POINT(${lonInicioDecimal} ${latInicioDecimal})`;

        // Calcular el largo entre los puntos de inicio y fin
        largo = await calcularDistanciaHaversine(
          latInicioDecimal,
          lonInicioDecimal,
          latDecimal,
          lonDecimal
        );
      } else {
        // Si no es el primer segmento, usar las coordenadas del segmento anterior
        const ultimoSegmento = await getUltimoSegmentoAction(transectaId);
        if (ultimoSegmento.data?.coordenadasFin) {
          // Convertir el Waypoint a string WKT
          wktPointInicio = `SRID=4326;POINT(${ultimoSegmento.data.coordenadasFin.longitud} ${ultimoSegmento.data.coordenadasFin.latitud})`;

          // Calcular el largo entre el punto final del segmento anterior y el punto final del nuevo segmento
          largo = await calcularDistanciaHaversine(
            ultimoSegmento.data.coordenadasFin.latitud,
            ultimoSegmento.data.coordenadasFin.longitud,
            latDecimal,
            lonDecimal
          );
        } else {
          throw new Error(
            "No se encontraron las coordenadas del segmento anterior"
          );
        }
      }

      const result = await createSegmentoAction({
        transecta_id: transectaId,
        numero: values.numero,
        coordenadas_inicio: wktPointInicio,
        coordenadas_fin: wktPointFin,
        profundidad_final: values.profundidad_final,
        profundidad_inicial: esPrimerSegmento
          ? values.profundidad_inicial
          : undefined,
        sustrato_id: parseInt(values.sustratoId),
        conteo: values.conteo,
        largo: largo,
        est_minima: 0,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Segmento creado exitosamente");
      onSuccess?.();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear el segmento"
      );
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Segmento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Segmento</DialogTitle>
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
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value);
                          field.onChange(value);
                          checkNumeroDisponible(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {!numeroDisponible && (
                      <p className="text-sm text-destructive">
                        Este número ya está en uso
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sustratoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sustrato</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

              {esPrimerSegmento ? (
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
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value)
                                )
                              }
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                  {/* Coordenadas del segmento anterior */}
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Coordenadas del segmento anterior:
                    </div>
                    <div className="font-mono">
                      {ultimoSegmento?.coordenadasFin && (
                        <>
                          {ultimoSegmento.coordenadasFin.latitud}° S,{" "}
                          {ultimoSegmento.coordenadasFin.longitud}° O
                        </>
                      )}
                    </div>
                  </div>

                  {/* Profundidad del segmento anterior */}
                  <div className="flex flex-col justify-center">
                    <div className="text-sm text-muted-foreground">
                      Profundidad del segmento anterior:
                    </div>
                    <div className="font-mono text-center">
                      {ultimoSegmento?.profundidadFinal} metros
                    </div>
                  </div>
                </div>
              )}
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
                            onChange={(e) =>
                              field.onChange(Number.parseFloat(e.target.value))
                            }
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
                        onChange={(e) =>
                          field.onChange(Number.parseInt(e.target.value))
                        }
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
