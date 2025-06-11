"use server";
import { getEmbarcacionesAction } from "@/lib/actions/embarcaciones";
import { getPersonasByRolAction } from "@/lib/actions/personas";
import { notFound } from "next/navigation";
import { TransectasView } from "@/components/campanias/transectas-view";

export default async function TransectasPage() {
  // Solo cargar embarcaciones y buzos, campania y transectas vienen del layout
  const [embarcacionesResult, buzosResult] = await Promise.all([
    getEmbarcacionesAction(),
    getPersonasByRolAction("BUZO"),
  ]);

  if (embarcacionesResult.error) {
    console.error("Error fetching embarcaciones:", embarcacionesResult.error);
    notFound();
  }

  if (buzosResult.error) {
    console.error("Error fetching buzos:", buzosResult.error);
    notFound();
  }

  const embarcaciones =
    embarcacionesResult.data?.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      matricula: e.matricula || "",
    })) || [];

  return (
    <TransectasView
      embarcaciones={embarcaciones}
      buzos={buzosResult.data || []}
    />
  );
}
