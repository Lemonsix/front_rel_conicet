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
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createCuadradoAction,
  checkCuadradoReplicaAvailabilityAction,
  getUltimoCuadradoAction,
} from "@/lib/actions/cuadrados";
import { getTransectasByCampaniaAction } from "@/lib/actions/transectas";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { Coordenada } from "@/lib/types/coordenadas";
import {
  calcularDistanciaHaversine,
  aseguraCoordenada,
} from "@/lib/utils/coordinates";

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
  campaniaId: z.number().min(1, "Seleccione una campaña"),
  transectaId: z.number().min(1, "Seleccione una transecta"),
  segmentoId: z.number().min(1, "Seleccione un segmento"),
  replica: z.number().min(1, "Ingrese un número de réplica"),
  tamanio: z.number().min(0.1, "El tamaño debe ser mayor a 0"),
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
  profundidad_inicio: z.number().min(0),
  profundidad_fin: z.number().min(0),
  conteo: z.number().min(0),
  tiene_muestreo: z.enum(["SI", "NO"]),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevoCuadradoFormProps {
  campaniaId: number;
  onSuccess?: () => void;
}

export function NuevoCuadradoForm({
  campaniaId,
  onSuccess,
}: NuevoCuadradoFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transectas, setTransectas] = useState<any[]>([]);
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [replicaDisponible, setReplicaDisponible] = useState(true);
  const [esPrimerCuadrado, setEsPrimerCuadrado] = useState(true);
  const [ultimoCuadrado, setUltimoCuadrado] = useState<any | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaniaId: campaniaId,
      transectaId: 0,
      segmentoId: 0,
      replica: 1,
      tamanio: 0.5,
      coordenadas_inicio: {
        latitud: {
          grados: 42,
          minutos: 0,
          segundos: 0,
          direccion: "S",
        },
        longitud: {
          grados: 64,
          minutos: 0,
          segundos: 0,
          direccion: "O",
        },
      },
      coordenadas_fin: {
        latitud: {
          grados: 42,
          minutos: 0,
          segundos: 0,
          direccion: "S",
        },
        longitud: {
          grados: 64,
          minutos: 0,
          segundos: 0,
          direccion: "O",
        },
      },
      profundidad_inicio: 0,
      profundidad_fin: 0,
      conteo: 0,
      tiene_muestreo: "NO",
    },
  });

  // Cargar transectas de la campaña
  useEffect(() => {
    const loadTransectas = async () => {
      try {
        const result = await getTransectasByCampaniaAction(campaniaId);
        if (result.error) {
          toast.error("Error al cargar transectas");
          return;
        }

        if (!result.data || result.data.length === 0) {
          toast.warning("No hay transectas disponibles para esta campaña");
          return;
        }

        setTransectas(result.data);
      } catch (error) {
        toast.error("Error al cargar transectas");
      }
    };

    if (isOpen) {
      loadTransectas();
    }
  }, [campaniaId, isOpen]);

  // Cargar segmentos cuando se selecciona una transecta
  useEffect(() => {
    const loadSegmentos = async () => {
      const transectaId = form.getValues("transectaId");
      if (!transectaId) return;

      try {
        const result = await getSegmentosByTransectaAction(transectaId);
        if (result.error) {
          toast.error("Error al cargar segmentos");
          return;
        }

        if (!result.data || result.data.length === 0) {
          toast.warning("No hay segmentos disponibles para esta transecta");
          setSegmentos([]);
          return;
        }

        setSegmentos(result.data);
      } catch (error) {
        toast.error("Error al cargar segmentos");
      }
    };

    loadSegmentos();
  }, [form.watch("transectaId")]);

  // Verificar si ya existe un cuadrado con el número de réplica
  const checkReplicaDisponible = async (
    segmentoId: number,
    replica: number
  ) => {
    if (!segmentoId || replica <= 0) return;

    try {
      const result = await checkCuadradoReplicaAvailabilityAction(
        segmentoId,
        replica
      );
      if (result.error) {
        toast.error("Error al verificar disponibilidad de réplica");
        return;
      }

      setReplicaDisponible(result.available ?? true);
    } catch (error) {
      toast.error("Error al verificar disponibilidad de réplica");
    }
  };

  // Buscar el último cuadrado cuando se selecciona un segmento
  useEffect(() => {
    const segmentoId = form.getValues("segmentoId");
    if (!segmentoId) return;

    const checkUltimoCuadrado = async () => {
      try {
        const result = await getUltimoCuadradoAction(segmentoId);

        // Si no hay error pero no hay datos, es el primer cuadrado
        if (!result.data && !result.error) {
          setEsPrimerCuadrado(true);
          setUltimoCuadrado(null);
          return;
        }

        if (result.error) {
          console.error("Error al buscar el último cuadrado:", result.error);
          return;
        }

        setEsPrimerCuadrado(false);
        setUltimoCuadrado(result.data);

        // Preseleccionar la réplica siguiente
        form.setValue("replica", result.data.replica + 1);
        checkReplicaDisponible(segmentoId, result.data.replica + 1);
      } catch (error) {
        console.error("Error al buscar el último cuadrado:", error);
      }
    };

    checkUltimoCuadrado();
  }, [form.watch("segmentoId")]);

  const onSubmit = async (values: FormValues) => {
    if (!replicaDisponible) {
      toast.error("El número de réplica ya está en uso en este segmento");
      return;
    }

    setLoading(true);
    try {
      // Crear coordenadas de inicio
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

      // Crear coordenadas de fin
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

      const result = await createCuadradoAction({
        segmento_id: values.segmentoId,
        replica: values.replica,
        tamanio: values.tamanio,
        coordenadas_inicio: coordenadaInicio.wkb,
        coordenadas_fin: coordenadaFin.wkb,
        profundidad_inicio: values.profundidad_inicio,
        profundidad_fin: values.profundidad_fin,
        conteo: values.conteo,
        tiene_muestreo: values.tiene_muestreo,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Cuadrado creado correctamente");
      onSuccess?.();
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el cuadrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Cuadrado</Button>
      </DialogTrigger>
      <DialogContent className="min-w-fit">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cuadrado</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selección de transecta */}
              <FormField
                control={form.control}
                name="transectaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transecta</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar transecta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transectas.map((transecta) => (
                          <SelectItem
                            key={transecta.id}
                            value={transecta.id.toString()}
                          >
                            {transecta.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selección de segmento */}
              <FormField
                control={form.control}
                name="segmentoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                      }}
                      value={field.value ? field.value.toString() : ""}
                      disabled={segmentos.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar segmento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {segmentos.map((segmento) => (
                          <SelectItem
                            key={segmento.id}
                            value={segmento.id.toString()}
                          >
                            {`Segmento ${segmento.numero}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Número de réplica */}
              <FormField
                control={form.control}
                name="replica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Réplica</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                          if (form.getValues("segmentoId")) {
                            checkReplicaDisponible(
                              form.getValues("segmentoId"),
                              value
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {!replicaDisponible && (
                      <p className="text-sm text-destructive">
                        Esta réplica ya existe en este segmento
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Tamaño del cuadrado */}
              <FormField
                control={form.control}
                name="tamanio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>metros cuadrados</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Muestreo */}
              <FormField
                control={form.control}
                name="tiene_muestreo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiene Muestreo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SI">Sí</SelectItem>
                        <SelectItem value="NO">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Punto de Inicio */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <FormLabel className="text-lg font-semibold">
                Punto de Inicio
              </FormLabel>

              <div className="flex flex-col md:flex-row gap-6 mt-3">
                {/* Coordenadas de Inicio */}
                <div className="space-y-4 flex-1">
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
                                  field.onChange(parseInt(e.target.value))
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
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="ml-2 text-sm font-medium">S</span>
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
                                  field.onChange(parseInt(e.target.value))
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
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="ml-2 text-sm font-medium">O</span>
                    </div>
                  </div>
                </div>

                {/* Profundidad Inicial */}
                <div className="w-40">
                  <FormField
                    control={form.control}
                    name="profundidad_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidad Inicial</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Profundidad"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
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
              <FormLabel className="text-lg font-semibold">
                Punto de Fin
              </FormLabel>

              <div className="flex flex-col md:flex-row gap-6 mt-3">
                {/* Coordenadas de Fin */}
                <div className="space-y-4 flex-1">
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
                                  field.onChange(parseInt(e.target.value))
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
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="ml-2 text-sm font-medium">S</span>
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
                                  field.onChange(parseInt(e.target.value))
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
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-center">
                              seg
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <span className="ml-2 text-sm font-medium">O</span>
                    </div>
                  </div>
                </div>

                {/* Profundidad Final */}
                <div className="w-40">
                  <FormField
                    control={form.control}
                    name="profundidad_fin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidad Final</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Profundidad"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
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
