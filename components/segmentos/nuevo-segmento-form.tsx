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
  createSegmentoAction,
  getSustratosAction,
} from "@/lib/actions/segmentos";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { toast } from "sonner";
import * as z from "zod";

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
      const result = await getSustratosAction();

      if (result.error) {
        toast.error("Error al cargar sustratos");
        return;
      }

      setSustratos(result.data || []);
    };

    fetchSustratos();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
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

      const result = await createSegmentoAction({
        transect_id: transectaId,
        coordenadas_fin: wktPoint,
        profundidad_final: values.profundidad,
        sustrato_id: parseInt(values.sustratoId),
        conteo: values.conteo,
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

  // Función para convertir coordenadas sexagesimales a decimales
  const sexagesimalToDecimal = (coord: string): number | null => {
    const match = coord.match(/(\d{2})°(\d{2})'(\d{2}\.\d{2})"([SW])/);
    if (!match) return null;

    const [, degrees, minutes, seconds, direction] = match;
    let decimal =
      parseFloat(degrees) +
      parseFloat(minutes) / 60 +
      parseFloat(seconds) / 3600;

    if (direction === "S" || direction === "W") {
      decimal = -decimal;
    }

    return decimal;
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="latitud"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitud</FormLabel>
                  <FormControl>
                    <IMaskInput
                      {...field}
                      mask={"00°00'00.00\"S"}
                      unmask={false}
                      lazy={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitud"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitud</FormLabel>
                  <FormControl>
                    <IMaskInput
                      {...field}
                      mask={"00°00'00.00\"W"}
                      unmask={false}
                      lazy={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profundidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profundidad (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
            <FormField
              control={form.control}
              name="conteo"
              render={({ field }) => (
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
