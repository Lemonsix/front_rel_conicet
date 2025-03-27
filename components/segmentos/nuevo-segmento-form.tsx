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
  checkSegmentoNumberAvailabilityAction,
  createSegmentoAction,
  getSustratosAction,
  getUltimoSegmentoAction,
} from "@/lib/actions/segmentos";
import { Segmento } from "@/lib/types/segmento";
import { Sustrato } from "@/lib/types/sustrato";
import { Coordenada } from "@/lib/types/coordenadas";
import {
  calcularDistanciaHaversine,
  aseguraCoordenada,
} from "@/lib/utils/coordinates";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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
  numero: z.number().min(1),
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
  profundidad_final: z.number().min(0),
  profundidad_inicial: z.number().min(0).optional(),
  conteo: z.number().min(0),
  sustratoId: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevoSegmentoFormProps {
  transectaId: number;
  onSuccess?: () => void;
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
      profundidad_final: 0,
      profundidad_inicial: 0,
      conteo: 0,
      sustratoId: "",
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
  }, []);

  useEffect(() => {
    const checkPrimerSegmento = async () => {
      const result = await getUltimoSegmentoAction(transectaId);
      setEsPrimerSegmento(!result.data);
      if (result.data) {
        setUltimoSegmento(result.data);
        // Preseleccionar el número siguiente
        form.setValue("numero", result.data.numero + 1);

        // Preseleccionar las coordenadas de inicio con las de fin del segmento anterior
        if (result.data.coordenadasFin) {
          try {
            const coordObj = result.data.coordenadasFin;
            console.log("Coordenadas finales del último segmento:", coordObj);

            // Si es un objeto serializado, usar directamente sexagesimal
            if (coordObj.sexagesimal) {
              const sexagesimal = coordObj.sexagesimal;
              console.log("Usando valores sexagesimales:", sexagesimal);

              if (sexagesimal.latitud && sexagesimal.longitud) {
                form.setValue("coordenadas_inicio", {
                  latitud: {
                    grados: sexagesimal.latitud.grados,
                    minutos: sexagesimal.latitud.minutos,
                    segundos: sexagesimal.latitud.segundos,
                    direccion: sexagesimal.latitud.direccion as "N" | "S",
                  },
                  longitud: {
                    grados: sexagesimal.longitud.grados,
                    minutos: sexagesimal.longitud.minutos,
                    segundos: sexagesimal.longitud.segundos,
                    direccion: sexagesimal.longitud.direccion as "E" | "O",
                  },
                });
              } else {
                console.error("Formato de coordenadas inválido");
              }
            } else {
              console.error(
                "Las coordenadas no están en formato serializado esperado"
              );
            }
          } catch (error) {
            console.error("Error al procesar coordenadas:", error);
          }
        }

        // Preseleccionar la profundidad inicial con la profundidad final del segmento anterior
        form.setValue("profundidad_inicial", result.data.profundidadFinal || 0);
      }
    };

    checkPrimerSegmento();
  }, [transectaId, form]);

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
      // Crear coordenadas de inicio
      let coordenadaInicio: Coordenada;
      if (esPrimerSegmento) {
        // Usar valores del formulario si es el primer segmento
        coordenadaInicio = Coordenada.fromSexagesimal({
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
      } else {
        // Usar las coordenadas finales del último segmento, que ahora son serializadas
        if (ultimoSegmento?.coordenadasFin?.wkb) {
          // Si tenemos WKB, lo usamos para crear la coordenada
          const wkb = ultimoSegmento.coordenadasFin.wkb;
          const coordObj = Coordenada.fromWKT(wkb);
          coordenadaInicio = coordObj || Coordenada.fromDecimal(0, 0);
        } else if (ultimoSegmento?.coordenadasFin?.decimal) {
          // Si tenemos decimal, lo usamos
          const decimal = ultimoSegmento.coordenadasFin.decimal;
          coordenadaInicio = Coordenada.fromDecimal(
            decimal.latitud,
            decimal.longitud
          );
        } else {
          // Fallback
          coordenadaInicio = Coordenada.fromDecimal(0, 0);
        }
      }

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

      const result = await createSegmentoAction({
        transecta_id: transectaId,
        numero: values.numero,
        coordenadas_inicio: coordenadaInicio.wkb,
        coordenadas_fin: coordenadaFin.wkb,
        profundidad_final: values.profundidad_final,
        profundidad_inicial: esPrimerSegmento
          ? values.profundidad_inicial
          : undefined,
        sustrato_id: parseInt(values.sustratoId),
        conteo: values.conteo,
        largo,
        est_minima: 0,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Segmento creado");
      onSuccess?.();
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  console.log(ultimoSegmento);

  // Función auxiliar para formatear coordenadas para mostrar
  function formatearCoordenadas(coord: any): string {
    try {
      if (!coord) return "Coordenadas no disponibles";

      // Si es un objeto serializado, usar directamente sus propiedades
      if (coord.sexagesimal) {
        const sexagesimal = coord.sexagesimal;
        if (!sexagesimal.latitud || !sexagesimal.longitud) {
          return "Formato de coordenadas inválido";
        }

        return `${sexagesimal.latitud.grados}° ${sexagesimal.latitud.minutos}' ${sexagesimal.latitud.segundos}" ${sexagesimal.latitud.direccion}, 
              ${sexagesimal.longitud.grados}° ${sexagesimal.longitud.minutos}' ${sexagesimal.longitud.segundos}" ${sexagesimal.longitud.direccion}`;
      }

      // Si es un objeto Coordenada, intentar obtener sexagesimal
      if (typeof coord === "object" && "sexagesimal" in coord) {
        return formatearCoordenadas(coord.sexagesimal);
      }

      // Intentar convertir a Coordenada si es una cadena
      if (typeof coord === "string") {
        const coordObj = aseguraCoordenada(coord);
        return formatearCoordenadas(coordObj);
      }

      return "Formato de coordenadas desconocido";
    } catch (error) {
      console.error("Error al formatear coordenadas:", error);
      return "Error al formatear coordenadas";
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Segmento</Button>
      </DialogTrigger>
      <DialogContent className="min-w-fit">
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

              {esPrimerSegmento ? (
                <div className="flex flex-col md:flex-row gap-6">
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
                        <FormField
                          control={form.control}
                          name="coordenadas_inicio.latitud.direccion"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
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
                        <FormField
                          control={form.control}
                          name="coordenadas_inicio.longitud.direccion"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
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
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Coordenadas del segmento anterior */}
                  <div className="space-y-4 flex-1">
                    <div className="text-sm text-muted-foreground">
                      Coordenadas del segmento anterior:
                    </div>
                    <div className="font-mono">
                      {ultimoSegmento?.coordenadasFin && (
                        <span>
                          {formatearCoordenadas(ultimoSegmento.coordenadasFin)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profundidad del segmento anterior */}
                  <div className="w-40">
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

              <div className="flex flex-col md:flex-row gap-6">
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
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.latitud.direccion"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
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
                      <FormField
                        control={form.control}
                        name="coordenadas_fin.longitud.direccion"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
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
