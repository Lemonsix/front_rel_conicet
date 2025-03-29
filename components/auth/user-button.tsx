"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "./logout-button";
import { User } from "@supabase/supabase-js";

interface UserButtonProps {
  user: User;
}

export function UserButton({ user }: UserButtonProps) {
  // Obtener las iniciales del email para el fallback del avatar
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Obtener la primera parte del email (antes del @)
  const getEmailUsername = (email: string) => {
    return email.split("@")[0];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>{getInitials(user.email || "UN")}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-left">
          <p className="text-sm font-medium leading-none">
            {user.user_metadata?.name ||
              getEmailUsername(user.email || "Usuario")}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-32">
            {user.email}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem>
          <LogoutButton
            variant="ghost"
            className="w-full justify-start p-0 h-auto"
          >
            Cerrar sesión
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
