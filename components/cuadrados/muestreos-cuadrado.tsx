"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMuestreosByCuadradoAction,
  createMuestreoCuadradoAction,
  updateMuestreoCuadradoAction,
  deleteMuestreoCuadradoAction,
} from "@/lib/actions/muestreos-cuadrados";
import { MuestreoCuadrado } from "@/lib/types/cuadrado";

interface MuestreosCuadradoProps {
  cuadradoId: number;
  initialMuestreos?: MuestreoCuadrado[];
}

export function MuestreosCuadrado({
  cuadradoId,
  initialMuestreos = [],
}: MuestreosCuadradoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [muestreos, setMuestreos] = useState<MuestreoCuadrado[]>(initialMuestreos);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingMuestreo, setEditingMuestreo] = useState<number | null>(null);

  // Estados para el formulario nuevo
  const [newTalla, setNewTalla] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Estados para edición
  const [editTalla, setEditTalla] = useState<number>(0);
  const [editOriginalId, setEditOriginalId] = useState<number>(0);

  // Cargar muestreos cuando se abre el dropdown (solo si no están precargados)
  useEffect(() => {
    if (isOpen && muestreos.length === 0 && initialMuestreos.length === 0) {
      loadMuestreos();
    }
  }, [isOpen, initialMuestreos.length]);

  // Actualizar muestreos si cambian los iniciales
  useEffect(() => {
    if (initialMuestreos.length > 0) {
      setMuestreos(initialMuestreos);
    }
  }, [initialMuestreos]);

  const loadMuestreos = async () => {
    setLoading(true);
    try {
      const result = await getMuestreosByCuadradoAction(cuadradoId);
      if (result.error) {
        toast.error("Error al cargar muestreos");
        return;
      }
      setMuestreos(result.data || []);
    } catch (error) {
      toast.error("Error al cargar muestreos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMuestreo = async () => {
    if (newTalla <= 0) {
      toast.error("La talla debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const result = await createMuestreoCuadradoAction({
        cuadrado_id: cuadradoId,
        talla: newTalla,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Muestreo agregado correctamente");
      resetNewForm();
      setShowNewForm(false);
      loadMuestreos();
    } catch (error) {
      toast.error("Error al crear muestreo");
    } finally {
      setSaving(false);
    }
  };

  const resetNewForm = () => {
    setNewTalla(0);
  };

  const handleStartEdit = (muestreo: MuestreoCuadrado) => {
    setEditingMuestreo(muestreo.id);
    setEditOriginalId(muestreo.id);
    setEditTalla(muestreo.talla || 0);
  };

  const handleCancelEdit = () => {
    setEditingMuestreo(null);
    setEditTalla(0);
    setEditOriginalId(0);
  };

  const handleUpdateMuestreo = async () => {
    if (editTalla <= 0) {
      toast.error("La talla debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const result = await updateMuestreoCuadradoAction(
        cuadradoId,
        editOriginalId,
        {
          talla: editTalla,
        }
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Muestreo actualizado correctamente");
      handleCancelEdit();
      loadMuestreos();
    } catch (error) {
      toast.error("Error al actualizar muestreo");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMuestreo = async (muestreoId: number) => {
    if (!confirm("¿Está seguro de eliminar este muestreo?")) {
      return;
    }

    setSaving(true);
    try {
      const result = await deleteMuestreoCuadradoAction(cuadradoId, muestreoId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Muestreo eliminado correctamente");
      loadMuestreos();
    } catch (error) {
      toast.error("Error al eliminar muestreo");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNew = () => {
    setShowNewForm(false);
    resetNewForm();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="ml-1 text-xs">Muestreos ({muestreos.length})</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50/50">
          {loading && (
            <div className="text-center text-gray-500 text-sm">
              Cargando muestreos...
            </div>
          )}

          {!loading && muestreos.length === 0 && (
            <div className="text-center text-gray-500 text-sm">
              No hay muestreos registrados
            </div>
          )}

          {!loading && muestreos.length > 0 && (
            <div className="space-y-2">
              {/* Headers */}
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 border-b pb-1">
                <div>ID</div>
                <div>Talla (mm)</div>
                <div>Acciones</div>
              </div>

              {/* Lista de muestreos */}
              {muestreos.map((muestreo) => (
                <div key={muestreo.id} className="grid grid-cols-3 gap-2 items-center">
                  {editingMuestreo === muestreo.id ? (
                    // Modo edición
                    <>
                      <div className="text-xs">{muestreo.id}</div>
                      <Input
                        type="number"
                        value={editTalla}
                        onChange={(e) => setEditTalla(parseFloat(e.target.value) || 0)}
                        className="text-xs h-7"
                        step="0.1"
                        placeholder="mm"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleUpdateMuestreo}
                          disabled={saving}
                          className="h-6 w-6 p-0"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Modo vista
                    <>
                      <div className="text-xs">{muestreo.id}</div>
                      <div className="text-xs">{muestreo.talla || "-"}</div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(muestreo)}
                          disabled={saving || editingMuestreo !== null}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMuestreo(muestreo.id)}
                          disabled={saving || editingMuestreo !== null}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulario para nuevo muestreo */}
          {showNewForm && (
            <div className="border-t pt-2 mt-2">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Nueva Talla
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-xs text-gray-500">Auto</div>
                <Input
                  type="number"
                  value={newTalla}
                  onChange={(e) => setNewTalla(parseFloat(e.target.value) || 0)}
                  placeholder="Talla (mm)"
                  className="text-xs h-7"
                  step="0.1"
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCreateMuestreo}
                    disabled={saving}
                    className="h-6 w-6 p-0"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelNew}
                    disabled={saving}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Botón para agregar nuevo muestreo */}
          {!showNewForm && (
            <div className="flex justify-center pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewForm(true)}
                disabled={saving || editingMuestreo !== null}
                className="text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar Muestreo
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
} 