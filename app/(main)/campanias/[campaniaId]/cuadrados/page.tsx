"use server";
import { getCampaniaByIdAction } from "@/lib/actions/campanias";
import { getCuadradosByCampaniaAction } from "@/lib/actions/cuadrados";
import { notFound } from "next/navigation";
import { CuadradosView } from "@/components/campanias/cuadrados-view";

export default async function CuadradosPage({
  params,
}: {
  params: Promise<{ campaniaId: number }>;
}) {
  const { campaniaId } = await params;

  // Cargar datos en paralelo en el servidor
  const [campaniaResult, cuadradosResult] = await Promise.all([
    getCampaniaByIdAction(campaniaId),
    getCuadradosByCampaniaAction(campaniaId),
  ]);

  if (campaniaResult.error || !campaniaResult.data) {
    console.error("Error fetching campaña:", campaniaResult.error);
    notFound();
  }

  if (cuadradosResult.error) {
    console.error("Error fetching cuadrados:", cuadradosResult.error);
    notFound();
  }

  return (
    <CuadradosView
      campania={campaniaResult.data}
      cuadrados={cuadradosResult.data || []}
    />
  );
}
