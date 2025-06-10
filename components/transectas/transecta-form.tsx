"use client";

import { Button } from "@/components/ui/button";
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
  getNombresTransectasAction,
} from "@/lib/actions/transectas";
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
});

interface TransectaFormProps {
  campaniaId: number;
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
}

export function TransectaForm({
  campaniaId,
  embarcaciones,
  buzos,
  onSuccess,
}: TransectaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nombresTransectas, setNombresTransectas] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [openBuzo, setOpenBuzo] = useState(false);
  const [filteredBuzos, setFilteredBuzos] = useState(buzos);

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      observaciones: "",
      fecha: "",
      hora_inicio: "",
      hora_fin: "",
      largo_manguera: "",
      sentido: "",
      embarcacion_id: "",
      buzo_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Crear timestamps combinando fecha y hora
      const hora_inicio = new Date(
        `${values.fecha}T${values.hora_inicio}`
      ).toISOString();
      const hora_fin = new Date(
        `${values.fecha}T${values.hora_fin}`
      ).toISOString();

      const { data, error } = await createTransectaAction({
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
      } as any);

      if (error) {
        console.error("Error al crear transecta:", error);
        throw new Error(error);
      }

      console.log("Transecta creada correctamente:", data);
      toast.success("La transecta se ha creado correctamente");
      form.reset();

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
                            )
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

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear transecta"}
        </Button>
      </form>
    </Form>
  );
}
