import { CampaniaView } from "@/components/campanias/campania-view";
import { getCampaniaByIdAction } from "@/lib/actions/campanias";
import { mapCampania } from "@/lib/mappers/campania";
import { mapTransectas } from "@/lib/mappers/transecta";
import { notFound } from "next/navigation";

export default async function CampaniaPage({
  params,
}: {
  params: Promise<{ campaniaId: number }>;
}) {
  const { campaniaId } = await params;
  const { data, error } = await getCampaniaByIdAction(campaniaId);

  if (error || !data) {
    console.error("Error fetching campaña:", error);
    notFound();
  }

  // Usar mappers para transformar los datos
  const campania = mapCampania(data.campania);
  const transectas = mapTransectas(data.transectas || []);

  // Asignar las transectas a la campaña
  campania.transectas = transectas;

  return <CampaniaView campania={campania} transectas={transectas} />;
}
