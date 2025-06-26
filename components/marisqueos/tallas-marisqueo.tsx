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
  getTallasByMarisqueoAction,
  createTallaMarisqueoAction,
  updateTallaMarisqueoAction,
  deleteTallaMarisqueoAction,
} from "@/lib/actions/tallas";
import { TallaMarisqueo } from "@/lib/types/marisqueos";

interface TallasMarisqueoProps {
  marisqueoId: number;
  initialTallas?: TallaMarisqueo[];
}

export function TallasMarisqueo({
  marisqueoId,
  initialTallas = [],
}: TallasMarisqueoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tallas, setTallas] = useState<TallaMarisqueo[]>(initialTallas);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingTalla, setEditingTalla] = useState<number | null>(null);

  // Estados para el formulario nuevo
  const [newTalla, setNewTalla] = useState<number>(0);
  const [newFrecuencia, setNewFrecuencia] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Estados para edición
  const [editTalla, setEditTalla] = useState<number>(0);
  const [editFrecuencia, setEditFrecuencia] = useState<number>(0);
  const [editOriginalTalla, setEditOriginalTalla] = useState<number>(0);

  // Cargar tallas cuando se abre el dropdown (solo si no están precargadas)
  useEffect(() => {
    if (isOpen && tallas.length === 0 && initialTallas.length === 0) {
      loadTallas();
    }
  }, [isOpen, initialTallas.length]);

  // Actualizar tallas si cambian las iniciales
  useEffect(() => {
    if (initialTallas.length > 0) {
      setTallas(initialTallas);
    }
  }, [initialTallas]);

  const loadTallas = async () => {
    setLoading(true);
    try {
      const result = await getTallasByMarisqueoAction(marisqueoId);
      if (result.error) {
        toast.error("Error al cargar tallas");
        return;
      }
      setTallas(result.data || []);
    } catch (error) {
      toast.error("Error al cargar tallas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTalla = async () => {
    if (newTalla <= 0 || newFrecuencia <= 0) {
      toast.error("Talla y frecuencia deben ser mayores a 0");
      return;
    }

    setSaving(true);
    try {
      const result = await createTallaMarisqueoAction({
        marisqueo_id: marisqueoId,
        talla: newTalla,
        frecuencia: newFrecuencia,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Talla agregada correctamente");
      setNewTalla(0);
      setNewFrecuencia(0);
      setShowNewForm(false);
      loadTallas();
    } catch (error) {
      toast.error("Error al crear talla");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (talla: TallaMarisqueo) => {
    setEditingTalla(talla.talla);
    setEditOriginalTalla(talla.talla);
    setEditTalla(talla.talla);
    setEditFrecuencia(talla.frecuencia);
  };

  const handleCancelEdit = () => {
    setEditingTalla(null);
    setEditTalla(0);
    setEditFrecuencia(0);
    setEditOriginalTalla(0);
  };

  const handleUpdateTalla = async () => {
    if (editTalla <= 0 || editFrecuencia <= 0) {
      toast.error("Talla y frecuencia deben ser mayores a 0");
      return;
    }

    setSaving(true);
    try {
      const result = await updateTallaMarisqueoAction(
        marisqueoId,
        editOriginalTalla,
        {
          talla: editTalla,
          frecuencia: editFrecuencia,
        }
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Talla actualizada correctamente");
      handleCancelEdit();
      loadTallas();
    } catch (error) {
      toast.error("Error al actualizar talla");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTalla = async (talla: number) => {
    if (!confirm("¿Está seguro de eliminar esta talla?")) {
      return;
    }

    setSaving(true);
    try {
      const result = await deleteTallaMarisqueoAction(marisqueoId, talla);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Talla eliminada correctamente");
      loadTallas();
    } catch (error) {
      toast.error("Error al eliminar talla");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNew = () => {
    setShowNewForm(false);
    setNewTalla(0);
    setNewFrecuencia(0);
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
          <span className="ml-1 text-xs">Tallas ({tallas.length})</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando tallas...</p>
          ) : (
            <>
              {tallas.length > 0 ? (
                <div className="space-y-2">
                  {tallas.map((talla) => (
                    <div key={talla.talla} className="flex items-center gap-2">
                      {editingTalla === talla.talla ? (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-1">
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
                            <Input
                              type="number"
                              placeholder="Frecuencia"
                              value={editFrecuencia || ""}
                              onChange={(e) =>
                                setEditFrecuencia(parseInt(e.target.value) || 0)
                              }
                              className="w-20 h-8"
                              min={1}
                            />
                            <span className="text-xs text-muted-foreground">
                              qty
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleUpdateTalla}
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
                            {talla.talla}mm
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {talla.frecuencia} unidades
                          </Badge>
                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEdit(talla)}
                              disabled={saving || editingTalla !== null}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTalla(talla.talla)}
                              disabled={saving || editingTalla !== null}
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
                  No hay tallas registradas
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
                      <Input
                        type="number"
                        placeholder="Frecuencia"
                        value={newFrecuencia || ""}
                        onChange={(e) =>
                          setNewFrecuencia(parseInt(e.target.value) || 0)
                        }
                        className="w-20 h-8"
                        min={1}
                      />
                      <span className="text-xs text-muted-foreground">qty</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCreateTalla}
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
                  disabled={saving || editingTalla !== null}
                  className="h-8 w-full border-dashed border"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar talla
                </Button>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
