"use server";
import { CampaniaView } from "@/components/campanias/campania-view";
import { getCampaniaByIdAction } from "@/lib/actions/campanias";
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

  return <CampaniaView campania={data} />;
}
