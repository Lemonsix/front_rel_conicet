"use server";
import { getCampaniaByIdAction } from "@/lib/actions/campanias";
import { getTransectaByIdAction } from "@/lib/actions/transectas";
import { getSegmentosByTransectaAction } from "@/lib/actions/segmentos";
import { getEmbarcacionesAction } from "@/lib/actions/embarcaciones";
import { getPersonasByRolAction } from "@/lib/actions/personas";
import { mapSegmentos as mapSegmentosFunction } from "@/lib/mappers/segmentos";
import { notFound } from "next/navigation";
import { TransectaDetailView } from "@/components/campanias/transecta-detail-view";

export default async function TransectaDetailPage({
  params,
}: {
  params: Promise<{ campaniaId: number; transectaId: number }>;
}) {
  const { campaniaId, transectaId } = await params;

  // Cargar datos en paralelo en el servidor
  const [
    campaniaResult,
    transectaResult,
    segmentosResult,
    embarcacionesResult,
    buzosResult,
  ] = await Promise.all([
    getCampaniaByIdAction(campaniaId),
    getTransectaByIdAction(transectaId),
    getSegmentosByTransectaAction(transectaId),
    getEmbarcacionesAction(),
    getPersonasByRolAction("BUZO"),
  ]);

  if (campaniaResult.error || !campaniaResult.data) {
    console.error("Error fetching campaña:", campaniaResult.error);
    notFound();
  }

  if (transectaResult.error || !transectaResult.data) {
    console.error("Error fetching transecta:", transectaResult.error);
    notFound();
  }

  if (segmentosResult.error) {
    console.error("Error fetching segmentos:", segmentosResult.error);
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

  const segmentos = segmentosResult.data
    ? mapSegmentosFunction(segmentosResult.data)
    : [];

  const embarcaciones =
    embarcacionesResult.data?.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      matricula: e.matricula || "",
    })) || [];

  return (
    <TransectaDetailView
      campania={campaniaResult.data}
      transecta={transectaResult.data}
      segmentos={segmentos}
      embarcaciones={embarcaciones}
      buzos={buzosResult.data || []}
    />
  );
}
