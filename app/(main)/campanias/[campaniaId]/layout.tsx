import { getCampaniaByIdAction } from "@/lib/actions/campanias";
import { notFound } from "next/navigation";
import { CampaniaNavigation } from "@/components/campanias/campania-navigation";

export default async function CampaniaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaniaId: number }>;
}) {
  const { campaniaId } = await params;
  const { data: campania, error } = await getCampaniaByIdAction(campaniaId);

  if (error || !campania) {
    console.error("Error fetching campaña:", error);
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <CampaniaNavigation campania={campania} />
      {children}
    </div>
  );
}
