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
import { Sustrato } from "@/lib/types/sustrato";
import {
  updateSegmentoAction,
  getSustratosAction,
} from "@/lib/actions/segmentos";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  decimalToSexagesimal,
  calcularDistanciaHaversine,
  decimalPositionToWKT,
} from "@/lib/utils/coordinates";

// Definir el esquema de validación
const formSchema = z.object({
  numero: z.number().min(1, "El número de segmento debe ser mayor a 0"),
  coordenadas_inicio: z.object({
    latitud: z.object({
      grados: z.number().min(0).max(90),
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
      direccion: z.enum(["N", "S"]),
    }),
    longitud: z.object({
      grados: z.number().min(0).max(180),
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
      direccion: z.enum(["E", "O"]),
    }),
  }),
  coordenadas_fin: z.object({
    latitud: z.object({
      grados: z.number().min(0).max(90),
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
      direccion: z.enum(["N", "S"]),
    }),
    longitud: z.object({
      grados: z.number().min(0).max(180),
      minutos: z.number().min(0).max(59),
      segundos: z.number().min(0).max(59.99),
      direccion: z.enum(["E", "O"]),
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
  onSuccess?: () => void;
}

export function EditarSegmentoForm({
  segmento,
  isOpen,
  onClose,
  onSuccess,
}: EditarSegmentoFormProps) {
  const [sustratos, setSustratos] = useState<Sustrato[]>([]);
  const [loading, setLoading] = useState(false);

  // Convertir las coordenadas del segmento a minutos y segundos
  const coordenadasInicio = segmento.coordenadasInicio
    ? {
        latitud: {
          grados: decimalToSexagesimal(
            segmento.coordenadasInicio.latitud,
            "latitud"
          ).grados,
          minutos: decimalToSexagesimal(
            segmento.coordenadasInicio.latitud,
            "latitud"
          ).minutos,
          segundos: decimalToSexagesimal(
            segmento.coordenadasInicio.latitud,
            "latitud"
          ).segundos,
          direccion: (decimalToSexagesimal(
            segmento.coordenadasInicio.latitud,
            "latitud"
          ).direccion === "N"
            ? "N"
            : "S") as "N" | "S",
        },
        longitud: {
          grados: decimalToSexagesimal(
            segmento.coordenadasInicio.longitud,
            "longitud"
          ).grados,
          minutos: decimalToSexagesimal(
            segmento.coordenadasInicio.longitud,
            "longitud"
          ).minutos,
          segundos: decimalToSexagesimal(
            segmento.coordenadasInicio.longitud,
            "longitud"
          ).segundos,
          direccion: (decimalToSexagesimal(
            segmento.coordenadasInicio.longitud,
            "longitud"
          ).direccion === "E"
            ? "E"
            : "O") as "E" | "O",
        },
      }
    : {
        latitud: {
          grados: 0,
          minutos: 0,
          segundos: 0,
          direccion: "S" as const,
        },
        longitud: {
          grados: 0,
          minutos: 0,
          segundos: 0,
          direccion: "O" as const,
        },
      };

  const coordenadasFin = segmento.coordenadasFin
    ? {
        latitud: {
          grados: decimalToSexagesimal(
            segmento.coordenadasFin.latitud,
            "latitud"
          ).grados,
          minutos: decimalToSexagesimal(
            segmento.coordenadasFin.latitud,
            "latitud"
          ).minutos,
          segundos: decimalToSexagesimal(
            segmento.coordenadasFin.latitud,
            "latitud"
          ).segundos,
          direccion: (decimalToSexagesimal(
            segmento.coordenadasFin.latitud,
            "latitud"
          ).direccion === "N"
            ? "N"
            : "S") as "N" | "S",
        },
        longitud: {
          grados: decimalToSexagesimal(
            segmento.coordenadasFin.longitud,
            "longitud"
          ).grados,
          minutos: decimalToSexagesimal(
            segmento.coordenadasFin.longitud,
            "longitud"
          ).minutos,
          segundos: decimalToSexagesimal(
            segmento.coordenadasFin.longitud,
            "longitud"
          ).segundos,
          direccion: (decimalToSexagesimal(
            segmento.coordenadasFin.longitud,
            "longitud"
          ).direccion === "E"
            ? "E"
            : "O") as "E" | "O",
        },
      }
    : {
        latitud: {
          grados: 0,
          minutos: 0,
          segundos: 0,
          direccion: "S" as const,
        },
        longitud: {
          grados: 0,
          minutos: 0,
          segundos: 0,
          direccion: "O" as const,
        },
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
      try {
        const result = await getSustratosAction();
        if (result.error) {
          toast.error("Error al cargar sustratos");
          return;
        }

        // Filtrar los sustratos para asegurar que código y descripción sean strings (no null)
        const sustratosFiltrados = (result.data || []).filter(
          (sustrato): sustrato is Sustrato =>
            typeof sustrato.codigo === "string" &&
            typeof sustrato.descripcion === "string"
        );

        setSustratos(sustratosFiltrados);

        console.log("Sustrato ID del segmento:", segmento.sustratoId);
        console.log("Valor actual del form:", form.getValues("sustratoId"));
      } catch (error) {
        toast.error("Error al cargar sustratos");
      }
    };
    fetchSustratos();
  }, [segmento.sustratoId, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Convertir coordenadas sexagesimales a decimales para punto final
      const latGrados = values.coordenadas_fin.latitud.grados;
      const latMinutos = values.coordenadas_fin.latitud.minutos;
      const latSegundos = values.coordenadas_fin.latitud.segundos;
      const latDireccion = values.coordenadas_fin.latitud.direccion;

      const lonGrados = values.coordenadas_fin.longitud.grados;
      const lonMinutos = values.coordenadas_fin.longitud.minutos;
      const lonSegundos = values.coordenadas_fin.longitud.segundos;
      const lonDireccion = values.coordenadas_fin.longitud.direccion;

      // Convertir a decimales
      let latDecimal = latGrados + latMinutos / 60 + latSegundos / 3600;
      latDecimal = latDireccion === "S" ? -latDecimal : latDecimal;

      let lonDecimal = lonGrados + lonMinutos / 60 + lonSegundos / 3600;
      lonDecimal = lonDireccion === "O" ? -lonDecimal : lonDecimal;

      // Convertir coordenadas sexagesimales a decimales para punto inicial
      const latInicioGrados = values.coordenadas_inicio.latitud.grados;
      const latInicioMinutos = values.coordenadas_inicio.latitud.minutos;
      const latInicioSegundos = values.coordenadas_inicio.latitud.segundos;
      const latInicioDireccion = values.coordenadas_inicio.latitud.direccion;

      const lonInicioGrados = values.coordenadas_inicio.longitud.grados;
      const lonInicioMinutos = values.coordenadas_inicio.longitud.minutos;
      const lonInicioSegundos = values.coordenadas_inicio.longitud.segundos;
      const lonInicioDireccion = values.coordenadas_inicio.longitud.direccion;

      // Convertir a decimales
      let latInicioDecimal =
        latInicioGrados + latInicioMinutos / 60 + latInicioSegundos / 3600;
      latInicioDecimal =
        latInicioDireccion === "S" ? -latInicioDecimal : latInicioDecimal;

      let lonInicioDecimal =
        lonInicioGrados + lonInicioMinutos / 60 + lonInicioSegundos / 3600;
      lonInicioDecimal =
        lonInicioDireccion === "O" ? -lonInicioDecimal : lonInicioDecimal;

      // Crear el punto WKT para las coordenadas de fin e inicio
      const wktPointFin = decimalPositionToWKT({
        latitud: latDecimal,
        longitud: lonDecimal,
      });

      const wktPointInicio = decimalPositionToWKT({
        latitud: latInicioDecimal,
        longitud: lonInicioDecimal,
      });

      // Calcular el largo entre los puntos de inicio y fin
      const largo = await calcularDistanciaHaversine(
        latInicioDecimal,
        lonInicioDecimal,
        latDecimal,
        lonDecimal
      );

      await updateSegmentoAction({
        id: segmento.id,
        transecta_id: segmento.transectaId,
        numero: values.numero,
        coordenadas_inicio: wktPointInicio,
        coordenadas_fin: wktPointFin,
        profundidad_final: values.profundidad_final,
        profundidad_inicial: values.profundidad_inicial || 0,
        sustrato_id: parseInt(values.sustratoId),
        conteo: values.conteo,
        largo: largo,
        est_minima: 0,
      });

      toast.success("Segmento actualizado exitosamente");
      onClose();
      onSuccess?.();
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
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.latitud.grados"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                readOnly
                                className="w-20 text-center "
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              grados
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">°</span>
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
                      <span className="text-base">&quot;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.latitud.direccion"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-[70px]">
                                  <SelectValue placeholder="Dir" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="N">N</SelectItem>
                                <SelectItem value="S">S</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Longitud Inicio */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.longitud.grados"
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
                              grados
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">°</span>
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
                      <span className="text-base">&quot;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_inicio.longitud.direccion"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-[70px]">
                                  <SelectValue placeholder="Dir" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="E">E</SelectItem>
                                <SelectItem value="O">O</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
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
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.latitud.grados"
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
                              grados
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">°</span>
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
                      <span className="text-base">&quot;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.latitud.direccion"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-[70px]">
                                  <SelectValue placeholder="Dir" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="N">N</SelectItem>
                                <SelectItem value="S">S</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Longitud Fin */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.longitud.grados"
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
                              grados
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="text-base">°</span>
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
                      <span className="text-base">&quot;</span>
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.longitud.direccion"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-[70px]">
                                  <SelectValue placeholder="Dir" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="E">E</SelectItem>
                                <SelectItem value="O">O</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
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
