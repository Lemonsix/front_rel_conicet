"use client";

import { useState, useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { IMaskInput } from "react-imask";
import type { ControllerRenderProps } from "react-hook-form";

// Definir el esquema de validación
const formSchema = z.object({
  latitud: z.string().min(1, "La latitud es requerida"),
  longitud: z.string().min(1, "La longitud es requerida"),
  profundidad: z.number().min(0, "La profundidad debe ser mayor o igual a 0"),
  conteo: z.number().min(0, "El conteo debe ser mayor o igual a 0"),
  sustratoId: z.string().min(1, "El sustrato es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

interface NuevoSegmentoFormProps {
  transectaId: number;
  onSegmentoCreado: () => void;
}

interface Sustrato {
  id: number;
  codigo: string;
  descripcion: string;
}

export function NuevoSegmentoForm({
  transectaId,
  onSegmentoCreado,
}: NuevoSegmentoFormProps) {
  const [sustratos, setSustratos] = useState<Sustrato[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitud: "",
      longitud: "",
      profundidad: 0,
      conteo: 0,
      sustratoId: "",
    },
  });

  useEffect(() => {
    const fetchSustratos = async () => {
      const { data, error } = await supabase
        .from("sustratos")
        .select("*")
        .order("codigo");

      if (error) {
        toast.error("Error al cargar sustratos");
        return;
      }

      setSustratos(data || []);
    };

    fetchSustratos();
  }, [supabase]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Convertir coordenadas sexagesimales a decimales
      const latDecimal = sexagesimalToDecimal(values.latitud);
      const lonDecimal = sexagesimalToDecimal(values.longitud);

      if (latDecimal === null || lonDecimal === null) {
        toast.error("Error al convertir las coordenadas");
        return;
      }

      // Crear el punto WKT
      const wktPoint = `SRID=4326;POINT(${lonDecimal} ${latDecimal})`;

      const { error } = await supabase.from("segmentos").insert([
        {
          transect_id: transectaId,
          coordenadas_fin: wktPoint,
          profundidad_final: values.profundidad,
          sustrato_id: parseInt(values.sustratoId),
          conteo: values.conteo,
        },
      ]);

      if (error) throw error;

      toast.success("Segmento creado exitosamente");
      onSegmentoCreado();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Error al crear el segmento");
      console.error("Error:", error);
    }
  };

  // Función para convertir coordenadas sexagesimales a decimales
  const sexagesimalToDecimal = (coord: string): number | null => {
    const match = coord.match(/^(\d+)°(\d+)'(\d+(\.\d+)?)"([NSEW])$/);
    if (!match) return null;

    const degrees = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    const direction = match[5];

    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") decimal = -decimal;

    return decimal;
  };

  const handleCoordinateAccept = (
    value: string,
    field: ControllerRenderProps<FormValues, "latitud" | "longitud">
  ) => {
    field.onChange(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Agregar Segmento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Segmento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="latitud"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<FormValues, "latitud">;
                }) => (
                  <FormItem>
                    <FormLabel>Latitud</FormLabel>
                    <FormControl>
                      <IMaskInput
                        mask={"00°00'00.00\"S"}
                        unmask={false}
                        value={field.value}
                        onAccept={(value) =>
                          handleCoordinateAccept(value, field)
                        }
                        placeholder={"42°19'25.83\"S"}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitud"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<FormValues, "longitud">;
                }) => (
                  <FormItem>
                    <FormLabel>Longitud</FormLabel>
                    <FormControl>
                      <IMaskInput
                        mask={"00°00'00.00\"W"}
                        unmask={false}
                        value={field.value}
                        onAccept={(value) =>
                          handleCoordinateAccept(value, field)
                        }
                        placeholder={"64°18'59.44\"W"}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="profundidad"
              render={({
                field,
              }: {
                field: ControllerRenderProps<FormValues, "profundidad">;
              }) => (
                <FormItem>
                  <FormLabel>Profundidad (m)</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conteo"
              render={({
                field,
              }: {
                field: ControllerRenderProps<FormValues, "conteo">;
              }) => (
                <FormItem>
                  <FormLabel>Conteo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sustratoId"
              render={({
                field,
              }: {
                field: ControllerRenderProps<FormValues, "sustratoId">;
              }) => (
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
                          {sustrato.codigo} - {sustrato.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
