import { getCampaniaByIdAction } from "@/lib/actions/campanias";
import { getMarisqueosByCampaniaAction } from "@/lib/actions/marisqueos";
import { notFound } from "next/navigation";
import { MarisqueosView } from "@/components/campanias/marisqueos-view";

export default async function MarisqueosPage({
  params,
}: {
  params: Promise<{ campaniaId: number }>;
}) {
  const { campaniaId } = await params;

  // Cargar datos en paralelo en el servidor
  const [campaniaResult, marisqueosResult] = await Promise.all([
    getCampaniaByIdAction(campaniaId),
    getMarisqueosByCampaniaAction(campaniaId),
  ]);

  if (campaniaResult.error || !campaniaResult.data) {
    console.error("Error fetching campaña:", campaniaResult.error);
    notFound();
  }

  if (marisqueosResult.error) {
    console.error("Error fetching marisqueos:", marisqueosResult.error);
    notFound();
  }

  return (
    <MarisqueosView
      campania={campaniaResult.data}
      marisqueos={marisqueosResult.data || []}
    />
  );
}
