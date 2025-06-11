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
import { Coordenada } from "@/lib/types/coordenadas";
import { calcularDistanciaHaversine } from "@/lib/utils/coordinates";
import { Label } from "@radix-ui/react-label";

// Definimos los tipos para el formulario
type FormLatitud = {
  grados: number;
  minutos: number;
  segundos: number;
  direccion: "N" | "S";
};

type FormLongitud = {
  grados: number;
  minutos: number;
  segundos: number;
  direccion: "E" | "O";
};

type FormCoordenadasSexagesimales = {
  latitud: FormLatitud;
  longitud: FormLongitud;
};

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

  // Convertir coordenadas de Coordenada a formato del formulario
  const coordenadasInicio = getFormSexagesimalFromCoordinate(
    segmento.coordenadasInicio
  );
  const coordenadasFin = getFormSexagesimalFromCoordinate(
    segmento.coordenadasFin
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: segmento.numero,
      profundidad_final: segmento.profundidadFinal || 0,
      profundidad_inicial: segmento.profundidadInicial || 0,
      conteo: segmento.conteo || 0,
      sustratoId: segmento.sustrato?.id?.toString() || "",
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
      } catch (error) {
        toast.error("Error al cargar sustratos");
      }
    };

    fetchSustratos();
  }, [segmento.sustratoId, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Crear coordenadas utilizando la clase Coordenada
      const coordenadaInicio = Coordenada.fromSexagesimal({
        latitud: {
          grados: values.coordenadas_inicio.latitud.grados,
          minutos: values.coordenadas_inicio.latitud.minutos,
          segundos: values.coordenadas_inicio.latitud.segundos,
          direccion: values.coordenadas_inicio.latitud.direccion,
        },
        longitud: {
          grados: values.coordenadas_inicio.longitud.grados,
          minutos: values.coordenadas_inicio.longitud.minutos,
          segundos: values.coordenadas_inicio.longitud.segundos,
          direccion: values.coordenadas_inicio.longitud.direccion,
        },
      });

      const coordenadaFin = Coordenada.fromSexagesimal({
        latitud: {
          grados: values.coordenadas_fin.latitud.grados,
          minutos: values.coordenadas_fin.latitud.minutos,
          segundos: values.coordenadas_fin.latitud.segundos,
          direccion: values.coordenadas_fin.latitud.direccion,
        },
        longitud: {
          grados: values.coordenadas_fin.longitud.grados,
          minutos: values.coordenadas_fin.longitud.minutos,
          segundos: values.coordenadas_fin.longitud.segundos,
          direccion: values.coordenadas_fin.longitud.direccion,
        },
      });

      // Obtener valores decimales para calcular la distancia
      const coordInicioDecimal = coordenadaInicio.decimal;
      const coordFinDecimal = coordenadaFin.decimal;

      // Calcular el largo entre los puntos de inicio y fin
      const largo = calcularDistanciaHaversine(
        coordInicioDecimal.latitud,
        coordInicioDecimal.longitud,
        coordFinDecimal.latitud,
        coordFinDecimal.longitud
      );

      await updateSegmentoAction({
        id: segmento.id,
        transecta_id: segmento.transectaId,
        numero: values.numero,
        coordenadas_inicio: coordenadaInicio.wkb,
        coordenadas_fin: coordenadaFin.wkb,
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

  // Función auxiliar para convertir una coordenada a formato de formulario
  function getFormSexagesimalFromCoordinate(
    coord?: Coordenada | null
  ): FormCoordenadasSexagesimales {
    if (!coord) {
      return getDefaultFormSexagesimal();
    }

    const sexagesimal = coord.sexagesimal;

    return {
      latitud: {
        grados: sexagesimal.latitud.grados,
        minutos: sexagesimal.latitud.minutos,
        segundos: sexagesimal.latitud.segundos,
        direccion: sexagesimal.latitud.direccion as "N" | "S", // Forzamos el tipo
      },
      longitud: {
        grados: sexagesimal.longitud.grados,
        minutos: sexagesimal.longitud.minutos,
        segundos: sexagesimal.longitud.segundos,
        direccion: sexagesimal.longitud.direccion as "E" | "O", // Forzamos el tipo
      },
    };
  }

  // Función auxiliar para crear coordenadas sexagesimales predeterminadas para el formulario
  function getDefaultFormSexagesimal(): FormCoordenadasSexagesimales {
    return {
      latitud: {
        grados: 0,
        minutos: 0,
        segundos: 0,
        direccion: "S",
      },
      longitud: {
        grados: 0,
        minutos: 0,
        segundos: 0,
        direccion: "O",
      },
    };
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-fit">
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

              <div className="flex flex-col md:flex-row gap-6">
                {/* Coordenadas de Inicio */}
                <div className="space-y-4 flex-1">
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
                              <FormDescription className="text-center">
                                dir
                              </FormDescription>
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
                              <FormDescription className="text-center">
                                dir
                              </FormDescription>
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
                <div className="w-40">
                  <FormField
                    control={form.control}
                    name="profundidad_inicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidad Inicial</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Profundidad"
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

            {/* Punto de Fin */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <FormLabel className="text-lg font-semibold">
                  Punto de Fin
                </FormLabel>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Coordenadas de Fin */}
                <div className="space-y-4 flex-1">
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
                              <FormDescription className="text-center">
                                dir
                              </FormDescription>
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
                              <FormDescription className="text-center">
                                dir
                              </FormDescription>
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
                <div className="w-40">
                  <FormField
                    control={form.control}
                    name="profundidad_final"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidad Final</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Profundidad"
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
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <FormField
                control={form.control}
                name="conteo"
                render={({ field }) => (
                  <FormItem className="flex-1 max-w-xs">
                    <FormLabel>Conteo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ingrese el conteo"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Permitir valor vacío o números válidos (incluyendo 0)
                          if (value === '' || value === '0' || !isNaN(Number(value))) {
                            field.onChange(value === '' ? 0 : Number(value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full md:w-40"
                  disabled={loading}
                >
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
