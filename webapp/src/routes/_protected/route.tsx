import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
// import { Header } from "@/components/layout/header";
import Config from "@/services/config-service";

export const Route = createFileRoute("/_protected")({
  component: RouteComponent,
  beforeLoad({ context, location }) {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/autenticacao/login",
        search: {
          // Pass current location to redirect back after login
          redirect: location.href,
        },
      });
    }
  },
});

function RouteComponent() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Header /> */}
      <div className="flex flex-1 flex-col gap-4 p-4 grow">
        <Outlet />
      </div>
      <footer className="p-2 bg-stone-100 text-muted-foreground h-8 print:hidden">
        <div className="flex items-center justify-between px-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} {Config.get("APP_NAME")}. Todos os direitos reservados.
          </p>
          <p className="text-xs">versão {Config.get("APP_VERSION")}</p>
        </div>
      </footer>
    </div>
  );
}
