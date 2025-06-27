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
        <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando muestreos...</p>
          ) : (
            <>
              {muestreos.length > 0 ? (
                <div className="space-y-2">
                  {muestreos.map((muestreo) => (
                    <div key={muestreo.id} className="flex items-center gap-2">
                      {editingMuestreo === muestreo.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              ID {muestreo.id}:
                            </span>
                            <Input
                              type="number"
                              placeholder="Talla"
                              value={editTalla || ""}
                              onChange={(e) =>
                                setEditTalla(parseInt(e.target.value) || 0)
                              }
                              className="w-20 h-8"
                              min={1}
                            />
                            <span className="text-xs text-muted-foreground">
                              mm
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleUpdateMuestreo}
                              disabled={saving}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <Badge variant="outline" className="text-xs">
                            ID {muestreo.id}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {muestreo.talla || "-"}mm
                          </Badge>
                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEdit(muestreo)}
                              disabled={saving || editingMuestreo !== null}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMuestreo(muestreo.id)}
                              disabled={saving || editingMuestreo !== null}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay muestreos registrados
                </p>
              )}

              {showNewForm ? (
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="Talla"
                        value={newTalla || ""}
                        onChange={(e) =>
                          setNewTalla(parseInt(e.target.value) || 0)
                        }
                        className="w-20 h-8"
                        min={1}
                      />
                      <span className="text-xs text-muted-foreground">mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCreateMuestreo}
                        disabled={saving}
                        className="h-8 w-8 p-0"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelNew}
                        disabled={saving}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewForm(true)}
                  disabled={saving || editingMuestreo !== null}
                  className="h-8 w-full border-dashed border"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar muestreo
                </Button>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
} 