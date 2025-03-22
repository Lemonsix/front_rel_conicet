import { AppSidebar } from "@/components/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-screen">
      <AppSidebar />
      <main className="flex flex-col h-full overflow-hidden w-full">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
