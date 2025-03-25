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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Persona } from "@/lib/types/persona";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { createCampaniaAction } from "@/lib/actions/campanias";
import { getPersonasAction } from "@/lib/actions/personas";

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  responsableId: z.string().min(1, "El responsable es requerido"),
  observaciones: z.string().optional(),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaniaFormProps {
  onSuccess?: () => void;
}

export function CampaniaForm({ onSuccess }: CampaniaFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [investigadores, setInvestigadores] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      responsableId: "",
      observaciones: "",
      fechaInicio: "",
    },
  });

  useEffect(() => {
    const fetchInvestigadores = async () => {
      const result = await getPersonasAction();

      if (result.error) {
        toast.error("Error al cargar investigadores");
        return;
      }

      setInvestigadores(
        result.data?.filter((p) => p.rol === "INVESTIGADOR") || []
      );
    };

    fetchInvestigadores();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const result = await createCampaniaAction({
        nombre: values.nombre,
        responsable_id: parseInt(values.responsableId, 10),
        observaciones: values.observaciones,
        inicio: values.fechaInicio,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Campaña creada exitosamente");
      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear la campaña"
      );
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Nueva Campaña</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Campaña</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar responsable" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {investigadores.map((investigador) => (
                        <SelectItem
                          key={investigador.id}
                          value={investigador.id.toString()}
                        >
                          {`${investigador.nombre} ${investigador.apellido}`}
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
              name="fechaInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
