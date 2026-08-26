import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/autenticacao")({
  component: RouteComponent,
  beforeLoad: ({ context, search, location }) => {
    if (context.auth.isAuthenticated) {
      const to = search.redirect || "/";
      throw redirect({ to });
    } else {
      if (location.href === "/autenticacao") {
        throw redirect({ to: "/autenticacao/login" });
      }
    }
  },
});

function RouteComponent() {
  // const src = Config.get("APP_LOGO_URL") || LoginImage;
  // const alt = Config.get("APP_NAME");
  return (
    // <div className="w-full lg:grid lg:min-h-dvh lg:grid-cols-2 xl:min-h-dvh">

    // </div>
    <Outlet />
  );
}
