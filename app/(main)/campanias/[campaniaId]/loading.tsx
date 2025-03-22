"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Loading } from "@/components/ui/loading";

export default function CampaniaLoading() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-full p-6 overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <Skeleton className="h-4 w-full mb-6" />
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <div className="pl-4">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-full">
        <Loading text="Cargando mapa..." />
      </div>
    </div>
  );
}
