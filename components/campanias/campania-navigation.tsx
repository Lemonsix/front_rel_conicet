"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Campania } from "@/lib/types/campania";

interface CampaniaNavigationProps {
  campania: Campania;
}

export function CampaniaNavigation({ campania }: CampaniaNavigationProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-6 pb-4">
        <div>
          <h1 className="text-3xl font-bold">{campania.nombre}</h1>
          <p className="text-muted-foreground">{campania.observaciones}</p>
        </div>

        {/* Navegación entre secciones */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/campanias/${campania.id}/transectas`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive("/transectas")
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Transectas
          </Link>
          <Link
            href={`/campanias/${campania.id}/marisqueos`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive("/marisqueos")
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Marisqueos
          </Link>
          <Link
            href={`/campanias/${campania.id}/cuadrados`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive("/cuadrados")
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Cuadrados
          </Link>
        </div>
      </div>
    </div>
  );
}
