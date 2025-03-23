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
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Persona } from "@/lib/types/persona";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";

// Definir el esquema de validación
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  responsableId: z.string().min(1, "El responsable es requerido"),
  observaciones: z.string().optional(),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaniaFormProps {
  onCampaniaCreada: () => void;
}

export function CampaniaForm({ onCampaniaCreada }: CampaniaFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [investigadores, setInvestigadores] = useState<Persona[]>([]);
  const supabase = createClient();

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
      const { data: investigadoresData, error } = await supabase
        .from("personas")
        .select("*")
        .eq("rol", "INVESTIGADOR");

      if (error) {
        console.error("Error cargando investigadores:", error);
        toast.error("Error al cargar investigadores");
        return;
      }

      setInvestigadores(investigadoresData || []);
    };

    fetchInvestigadores();
  }, [supabase]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from("campanias")
        .insert([
          {
            nombre: values.nombre,
            responsable_id: values.responsableId,
            observaciones: values.observaciones,
            inicio: values.fechaInicio,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Campaña creada exitosamente");
      form.reset();
      setIsOpen(false);
      onCampaniaCreada();
    } catch (error) {
      console.error("Error creando campaña:", error);
      toast.error("Error al crear la campaña");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Nueva Campaña</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Campaña</DialogTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsableId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {investigadores.map((investigador) => (
                          <SelectItem
                            key={investigador.id}
                            value={investigador.id.toString()}
                          >
                            {investigador.nombre} {investigador.apellido}
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
            </div>
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
