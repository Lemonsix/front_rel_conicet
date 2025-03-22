"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  text?: string;
  className?: string;
}

export function Loading({ text = "Cargando...", className }: LoadingProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-background",
        className
      )}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
