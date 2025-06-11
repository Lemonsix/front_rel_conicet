"use server";
import { getCampaniaByIdAction } from "@/lib/actions/campanias";
import { getEmbarcacionesAction } from "@/lib/actions/embarcaciones";
import { getPersonasByRolAction } from "@/lib/actions/personas";
import { notFound } from "next/navigation";
import { TransectasView } from "@/components/campanias/transectas-view";

export default async function TransectasPage({
  params,
}: {
  params: Promise<{ campaniaId: number }>;
}) {
  const { campaniaId } = await params;

  // Cargar datos en paralelo en el servidor
  const [campaniaResult, embarcacionesResult, buzosResult] = await Promise.all([
    getCampaniaByIdAction(campaniaId),
    getEmbarcacionesAction(),
    getPersonasByRolAction("BUZO"),
  ]);

  if (campaniaResult.error || !campaniaResult.data) {
    console.error("Error fetching campaña:", campaniaResult.error);
    notFound();
  }

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
      campania={campaniaResult.data}
      embarcaciones={embarcaciones}
      buzos={buzosResult.data || []}
    />
  );
}
