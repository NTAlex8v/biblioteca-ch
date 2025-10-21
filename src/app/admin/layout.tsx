// This is a simplified auth guard for demonstration purposes.
// In a real app, you would use a proper authentication library and server-side checks.

const userRole = 'Admin'; // Mock role

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (userRole !== 'Admin' && userRole !== 'Editor') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permiso para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
