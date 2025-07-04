"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createTransectaAction,
  updateTransectaAction,
  getNombresTransectasAction,
} from "@/lib/actions/transectas";
import { Transecta } from "@/lib/types/transecta";
import {
  combineDateTime,
  safeGetTime,
  safeGetDate,
} from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  observaciones: z.string().optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora_inicio: z.string().min(1, "La hora de inicio es requerida"),
  hora_fin: z.string().min(1, "La hora de fin es requerida"),
  largo_manguera: z.string().optional(),
  sentido: z.string().min(1, "El sentido es requerido"),
  embarcacion_id: z.string().optional(),
  buzo_id: z.string().optional(),
  replica: z.boolean().default(false),
});

interface TransectaFormProps {
  campaniaId: number;
  transecta?: Transecta; // Opcional para modo edición
  embarcaciones: Array<{
    id: number;
    nombre: string;
    matricula: string;
  }>;
  buzos: Array<{
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  }>;
  onSuccess?: () => void;
  onCancel?: () => void; // Para modo edición
}

export function TransectaForm({
  campaniaId,
  transecta,
  embarcaciones,
  buzos,
  onSuccess,
  onCancel,
}: TransectaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nombresTransectas, setNombresTransectas] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [openBuzo, setOpenBuzo] = useState(false);
  const [filteredBuzos, setFilteredBuzos] = useState(buzos);

  const isEditMode = !!transecta;

  useEffect(() => {
    async function fetchNombres() {
      try {
        const { data, error } = await getNombresTransectasAction();
        if (error) throw new Error(error);
        setNombresTransectas(data || []);
      } catch (error) {
        console.error("Error fetching nombres:", error);
        toast.error("Error al cargar los nombres de transectas");
      }
    }

    fetchNombres();
  }, []);

  // Función para convertir fecha ISO a formato date input
  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return "";

    // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
    if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return isoDate;
    }

    // Si es timestamp ISO, extraer solo la fecha
    if (isoDate.includes("T")) {
      return isoDate.split("T")[0];
    }

    // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
    if (isoDate.includes("/")) {
      const [day, month, year] = isoDate.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Intentar parsear como fecha y formatear
    try {
      const date = new Date(isoDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.warn("Error parsing date:", isoDate);
    }

    return "";
  };

  // Función para convertir hora ISO a formato time input
  const formatTimeForInput = (isoTime: string) => {
    return safeGetTime(isoTime);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
      ? {
          nombre: transecta.nombre,
          observaciones: transecta.observaciones || "",
          fecha: formatDateForInput(transecta.fecha),
          hora_inicio: formatTimeForInput(transecta.horaInicio),
          hora_fin: formatTimeForInput(transecta.horaFin),
          largo_manguera: transecta.largoManguera?.toString() || "",
          sentido: transecta.sentido,
          embarcacion_id: transecta.embarcacionId?.toString() || "",
          buzo_id: transecta.buzoId?.toString() || "",
          replica: transecta.esReplica || false,
        }
      : {
          nombre: "",
          observaciones: "",
          fecha: "",
          hora_inicio: "",
          hora_fin: "",
          largo_manguera: "",
          sentido: "",
          embarcacion_id: "",
          buzo_id: "",
          replica: false,
        },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Usar las funciones de datetime.ts para crear timestamps seguros
      const hora_inicio = combineDateTime(values.fecha, values.hora_inicio);
      const hora_fin = combineDateTime(values.fecha, values.hora_fin);

      if (!hora_inicio || !hora_fin) {
        throw new Error("Error al procesar las fechas y horas");
      }

      const formData = {
        ...values,
        hora_inicio,
        hora_fin,
        largo_manguera: values.largo_manguera
          ? parseFloat(values.largo_manguera)
          : undefined,
        embarcacion_id: values.embarcacion_id
          ? parseInt(values.embarcacion_id)
          : undefined,
        buzo_id: values.buzo_id ? parseInt(values.buzo_id) : undefined,
        campania_id: campaniaId,
        replica: values.replica,
      } as any;

      let result;
      if (isEditMode) {
        result = await updateTransectaAction(transecta.id, formData);
      } else {
        result = await createTransectaAction(formData);
      }

      const { data, error } = result;

      if (error) {
        console.error(
          `Error al ${isEditMode ? "actualizar" : "crear"} transecta:`,
          error
        );
        throw new Error(error);
      }

      console.log(
        `Transecta ${isEditMode ? "actualizada" : "creada"} correctamente:`,
        data
      );
      toast.success(
        `La transecta se ha ${
          isEditMode ? "actualizado" : "creado"
        } correctamente`
      );

      if (!isEditMode) {
        form.reset();
      }

      // Small delay to ensure database write is complete before refreshing
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Make sure to call onSuccess
      if (onSuccess) {
        try {
          await onSuccess();
        } catch (callbackError) {
          console.error("Error en callback onSuccess:", callbackError);
        }
      }
    } catch (error) {
      console.error("Error completo:", error);
      toast.error(
        error instanceof Error ? error.message : "Ha ocurrido un error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Nombre</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? nombresTransectas.find(
                              (nombre) => nombre === field.value
                            ) || field.value
                          : "Selecciona un nombre..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="flex flex-col">
                      <div className="flex items-center border-b px-3">
                        <Input
                          placeholder="Buscar nombre..."
                          className="h-11 border-0 focus-visible:ring-0"
                          onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            const filtered = nombresTransectas.filter(
                              (nombre) =>
                                nombre.toLowerCase().includes(searchTerm)
                            );
                            setNombresTransectas(filtered);
                          }}
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {nombresTransectas.length === 0 ? (
                          <div className="py-6 text-center text-sm">
                            No se encontraron nombres.
                          </div>
                        ) : (
                          <div className="p-1">
                            {nombresTransectas.map((nombre) => (
                              <div
                                key={nombre}
                                className={cn(
                                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                  nombre === field.value &&
                                    "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                  form.setValue("nombre", nombre);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    nombre === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {nombre}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hora_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de inicio</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hora_fin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de fin</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="largo_manguera"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Largo de manguera (m)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ej: 25.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sentido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sentido</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un sentido" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="N-S">N-S</SelectItem>
                    <SelectItem value="S-N">S-N</SelectItem>
                    <SelectItem value="E-O">E-O</SelectItem>
                    <SelectItem value="O-E">O-E</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="embarcacion_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Embarcación</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una embarcación" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {embarcaciones.map((embarcacion) => (
                      <SelectItem
                        key={embarcacion.id}
                        value={embarcacion.id.toString()}
                      >
                        {embarcacion.nombre} ({embarcacion.matricula})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buzo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buzo</FormLabel>
                <Popover open={openBuzo} onOpenChange={setOpenBuzo}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBuzo}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? buzos.find(
                              (buzo) => buzo.id.toString() === field.value
                            )
                            ? `${
                                buzos.find(
                                  (buzo) => buzo.id.toString() === field.value
                                )?.nombre
                              } ${
                                buzos.find(
                                  (buzo) => buzo.id.toString() === field.value
                                )?.apellido
                              }`
                            : "Selecciona un buzo..."
                          : "Selecciona un buzo..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="flex flex-col">
                      <div className="flex items-center border-b px-3">
                        <Input
                          placeholder="Buscar buzo..."
                          className="h-11 border-0 focus-visible:ring-0"
                          onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            const filtered = buzos.filter(
                              (buzo) =>
                                buzo.nombre
                                  .toLowerCase()
                                  .includes(searchTerm) ||
                                buzo.apellido.toLowerCase().includes(searchTerm)
                            );
                            setFilteredBuzos(filtered);
                          }}
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredBuzos.length === 0 ? (
                          <div className="py-6 text-center text-sm">
                            No se encontraron buzos.
                          </div>
                        ) : (
                          <div className="p-1">
                            {filteredBuzos.map((buzo) => (
                              <div
                                key={buzo.id}
                                className={cn(
                                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                  buzo.id.toString() === field.value &&
                                    "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                  form.setValue("buzo_id", buzo.id.toString());
                                  setOpenBuzo(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    buzo.id.toString() === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {buzo.nombre} {buzo.apellido}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observaciones sobre la transecta"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="replica"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Es réplica</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marcar si esta transecta es una réplica de otra transecta
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? `${isEditMode ? "Actualizando" : "Creando"}...`
              : `${isEditMode ? "Actualizar" : "Crear"} transecta`}
          </Button>
          {isEditMode && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

// Componente específico para crear transectas
export function CrearTransectaForm(
  props: Omit<TransectaFormProps, "transecta">
) {
  return <TransectaForm {...props} />;
}

// Componente específico para editar transectas
export function EditarTransectaForm(
  props: TransectaFormProps & { transecta: Transecta }
) {
  return <TransectaForm {...props} />;
}
