"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "@supabase/supabase-js";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Perfil de usuario</CardTitle>
        <CardDescription>Información de tu cuenta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="truncate">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">ID</p>
            <p className="text-xs truncate">{user.id}</p>
          </div>
          {user.user_metadata?.name && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nombre
              </p>
              <p>{user.user_metadata.name}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <LogoutButton />
      </CardFooter>
    </Card>
  );
}
