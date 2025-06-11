"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteSegmentoAction } from "@/lib/actions/segmentos";
import { Segmento } from "@/lib/types/segmento";
import { useState } from "react";
import { toast } from "sonner";

interface EliminarSegmentoDialogProps {
  segmento: Segmento | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EliminarSegmentoDialog({
  segmento,
  isOpen,
  onClose,
  onSuccess,
}: EliminarSegmentoDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEliminar = async () => {
    if (!segmento) return;

    setIsDeleting(true);
    try {
      const result = await deleteSegmentoAction(segmento.id);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Segmento eliminado exitosamente");
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Error al eliminar el segmento"
      );
      console.error("Error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar segmento?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            segmento N° {segmento?.numero} y todos sus datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEliminar}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
