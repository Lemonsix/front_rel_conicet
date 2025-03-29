export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen flex flex-col items-center justify-center bg-muted/40">
      <div className="absolute inset-0 bg-grid-foreground/[0.02] bg-[size:var(--grid-size)_var(--grid-size)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      <div className="relative w-full max-w-md p-8 rounded-lg border border-border bg-background shadow-lg">
        {children}
      </div>
    </div>
  );
}
