"use server";
import { redirect } from "next/navigation";

export default async function CampaniaPage({
  params,
}: {
  params: Promise<{ campaniaId: number }>;
}) {
  const { campaniaId } = await params;

  // Redirigir a transectas por defecto
  redirect(`/campanias/${campaniaId}/transectas`);
}
