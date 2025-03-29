import { UserProfile } from "@/components/auth/user-profile";
import { createClient } from "@/lib/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
      <p className="text-center mb-10 text-muted-foreground">
        Bienvenido al sistema, has iniciado sesión correctamente
      </p>

      <UserProfile user={user} />
    </div>
  );
}
