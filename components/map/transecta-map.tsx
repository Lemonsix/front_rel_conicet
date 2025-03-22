"use client";

import { Segmento } from "@/lib/types/segmento";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./map").then((mod) => mod.Map), {
  loading: () => (
    <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    </div>
  ),
  ssr: false,
});

interface TransectaMapProps {
  segmentos: Segmento[];
}

export function TransectaMap({ segmentos }: TransectaMapProps) {
  return <Map segmentos={segmentos} />;
}
