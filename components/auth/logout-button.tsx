"use client";

import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

interface LogoutButtonProps
  extends React.ComponentProps<"button">,
    Partial<VariantProps<typeof Button>> {
  showIcon?: boolean;
}

export function LogoutButton({
  showIcon = true,
  children,
  ...props
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOutAction();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
      {...props}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {children || "Cerrar sesión"}
    </Button>
  );
}
