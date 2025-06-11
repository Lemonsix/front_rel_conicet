import { getCampaniaByIdAction } from "@/lib/actions/campanias";
import { notFound } from "next/navigation";
import { CampaniaNavigation } from "@/components/campanias/campania-navigation";
import { CampaniaProvider } from "@/components/campanias/campania-provider";

export default async function CampaniaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaniaId: number }>;
}) {
  const { campaniaId } = await params;

  // Cargar solo la campaña que ya incluye las transectas correctamente mapeadas
  const campaniaResult = await getCampaniaByIdAction(campaniaId);

  if (campaniaResult.error || !campaniaResult.data) {
    console.error("Error fetching campaña:", campaniaResult.error);
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <CampaniaNavigation campania={campaniaResult.data} />
      <CampaniaProvider
        campania={campaniaResult.data}
        transectas={campaniaResult.data.transectas || []}
      >
        {children}
      </CampaniaProvider>
    </div>
  );
}
