"use client";

import { createContext, useContext, ReactNode } from "react";
import { Campania } from "@/lib/types/campania";
import { Transecta } from "@/lib/types/transecta";

interface CampaniaContextType {
  campania: Campania;
  transectas: Transecta[];
}

const CampaniaContext = createContext<CampaniaContextType | undefined>(
  undefined
);

interface CampaniaProviderProps {
  children: ReactNode;
  campania: Campania;
  transectas: Transecta[]; // Already mapped data
}

export function CampaniaProvider({
  children,
  campania,
  transectas,
}: CampaniaProviderProps) {
  // Función de utilidad para ordenar transectas
  const transectasOrdenadas = [...transectas].sort((a, b) => {
    const nameA = a.nombre || "";
    const nameB = b.nombre || "";
    return nameA.localeCompare(nameB, "es-ES", {
      numeric: true,
      sensitivity: "base",
    });
  });

  return (
    <CampaniaContext.Provider
      value={{
        campania,
        transectas: transectasOrdenadas,
      }}
    >
      {children}
    </CampaniaContext.Provider>
  );
}

export function useCampania() {
  const context = useContext(CampaniaContext);
  if (context === undefined) {
    throw new Error("useCampania must be used within a CampaniaProvider");
  }
  return context;
}
