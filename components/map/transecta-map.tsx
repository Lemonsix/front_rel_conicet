"use client";

import { Segmento } from "@/lib/types/segmento";
import dynamic from "next/dynamic";
import { Loading } from "@/components/ui/loading";

const Map = dynamic(() => import("./map").then((mod) => mod.Map), {
  loading: () => (
    <Loading text="Cargando mapa..." className="h-[calc(100vh-4rem)]" />
  ),
  ssr: false,
});

interface TransectaMapProps {
  segmentos: Segmento[];
}

export function TransectaMap({ segmentos }: TransectaMapProps) {
  return <Map segmentos={segmentos} />;
}
