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
  createMarisqueoAction,
  checkMarisqueoCapturaAvailabilityAction,
  getUltimoMarisqueoAction,
} from "@/lib/actions/marisqueos";
import { getTransectasByCampaniaAction } from "@/lib/actions/transectas";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { getPersonasByRolAction } from "@/lib/actions/personas";
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
  buzoId: z.number().min(1, "Seleccione un buzo"),
  nCaptura: z.number().min(1, "Ingrese un número de captura"),
  coordenadas: z.object({
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
  profundidad: z.number().min(0).optional(),
  tiempo: z.number().min(0).optional(),
  pesoMuestra: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevoMarisqueoFormProps {
  campaniaId: number;
  onSuccess?: () => void;
}

export function NuevoMarisqueoForm({
  campaniaId,
  onSuccess,
}: NuevoMarisqueoFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transectas, setTransectas] = useState<any[]>([]);
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [buzos, setBuzos] = useState<any[]>([]);
  const [capturaDisponible, setCapturaDisponible] = useState(true);
  const [esPrimerMarisqueo, setEsPrimerMarisqueo] = useState(true);
  const [ultimoMarisqueo, setUltimoMarisqueo] = useState<any | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaniaId: campaniaId,
      transectaId: 0,
      segmentoId: 0,
      buzoId: 0,
      nCaptura: 1,
      coordenadas: {
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
      profundidad: 0,
      tiempo: 0,
      pesoMuestra: 0,
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

    const loadBuzos = async () => {
      try {
        const result = await getPersonasByRolAction("BUZO");
        if (result.error) {
          toast.error("Error al cargar buzos");
          return;
        }

        if (!result.data || result.data.length === 0) {
          toast.warning("No hay buzos disponibles");
          return;
        }

        setBuzos(result.data);
      } catch (error) {
        toast.error("Error al cargar buzos");
      }
    };

    if (isOpen) {
      loadTransectas();
      loadBuzos();
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

  // Verificar si ya existe un marisqueo con el número de captura
  const checkCapturaDisponible = async (
    segmentoId: number,
    nCaptura: number
  ) => {
    if (!segmentoId || nCaptura <= 0) return;

    try {
      const result = await checkMarisqueoCapturaAvailabilityAction(
        segmentoId,
        nCaptura
      );
      if (result.error) {
        toast.error("Error al verificar disponibilidad de captura");
        return;
      }

      setCapturaDisponible(result.available ?? true);
    } catch (error) {
      toast.error("Error al verificar disponibilidad de captura");
    }
  };

  // Buscar el último marisqueo cuando se selecciona un segmento
  useEffect(() => {
    const segmentoId = form.getValues("segmentoId");
    if (!segmentoId) return;

    const checkUltimoMarisqueo = async () => {
      try {
        const result = await getUltimoMarisqueoAction(segmentoId);

        // Si no hay error pero no hay datos, es el primer marisqueo
        if (!result.data && !result.error) {
          setEsPrimerMarisqueo(true);
          setUltimoMarisqueo(null);
          return;
        }

        if (result.error) {
          console.error("Error al buscar el último marisqueo:", result.error);
          return;
        }

        setEsPrimerMarisqueo(false);
        setUltimoMarisqueo(result.data);

        // Preseleccionar el número de captura siguiente
        form.setValue("nCaptura", result.data.n_captura + 1);
        checkCapturaDisponible(segmentoId, result.data.n_captura + 1);
      } catch (error) {
        console.error("Error al buscar el último marisqueo:", error);
      }
    };

    checkUltimoMarisqueo();
  }, [form.watch("segmentoId")]);

  const onSubmit = async (values: FormValues) => {
    if (!capturaDisponible) {
      toast.error("El número de captura ya está en uso en este segmento");
      return;
    }

    setLoading(true);
    try {
      // Crear coordenadas
      const coordenada = Coordenada.fromSexagesimal({
        latitud: {
          grados: values.coordenadas.latitud.grados,
          minutos: values.coordenadas.latitud.minutos,
          segundos: values.coordenadas.latitud.segundos,
          direccion: values.coordenadas.latitud.direccion,
        },
        longitud: {
          grados: values.coordenadas.longitud.grados,
          minutos: values.coordenadas.longitud.minutos,
          segundos: values.coordenadas.longitud.segundos,
          direccion: values.coordenadas.longitud.direccion,
        },
      });

      const result = await createMarisqueoAction({
        segmento_id: values.segmentoId,
        buzo_id: values.buzoId,
        n_captura: values.nCaptura,
        coordenadas: coordenada.wkb,
        profundidad: values.profundidad,
        tiempo: values.tiempo,
        peso_muestra: values.pesoMuestra,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Marisqueo creado correctamente");
      onSuccess?.();
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el marisqueo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Marisqueo</Button>
      </DialogTrigger>
      <DialogContent className="min-w-fit">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Marisqueo</DialogTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selección de buzo */}
              <FormField
                control={form.control}
                name="buzoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buzo</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar buzo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buzos.map((buzo) => (
                          <SelectItem key={buzo.id} value={buzo.id.toString()}>
                            {`${buzo.nombre} ${buzo.apellido}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Número de captura */}
              <FormField
                control={form.control}
                name="nCaptura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Captura</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                          if (form.getValues("segmentoId")) {
                            checkCapturaDisponible(
                              form.getValues("segmentoId"),
                              value
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {!capturaDisponible && (
                      <p className="text-sm text-destructive">
                        Esta captura ya existe en este segmento
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            {/* Coordenadas */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <FormLabel className="text-lg font-semibold">
                Coordenadas del Marisqueo
              </FormLabel>

              <div className="space-y-4 flex-1 mt-3">
                {/* Latitud */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-base font-medium">42°</span>
                    <FormField
                      control={form.control}
                      name="coordenadas.latitud.minutos"
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
                      name="coordenadas.latitud.segundos"
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

                {/* Longitud */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-base font-medium">64°</span>
                    <FormField
                      control={form.control}
                      name="coordenadas.longitud.minutos"
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
                      name="coordenadas.longitud.segundos"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profundidad */}
              <FormField
                control={form.control}
                name="profundidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profundidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Profundidad en metros"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>metros</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tiempo */}
              <FormField
                control={form.control}
                name="tiempo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Captura</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Tiempo en minutos"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>minutos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Peso de la muestra */}
              <FormField
                control={form.control}
                name="pesoMuestra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso de la Muestra</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Peso en kg"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>kilogramos</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-40"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
