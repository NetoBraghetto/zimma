import { createRootRoute, HeadContent, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import NoDataSvg from "@/assets/images/undraw_no_data.svg?url";
import { buttonVariants } from "@/components/ui/button";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 text-center text-foreground">
      <img src={NoDataSvg} alt="Página não encontrada" className="w-72 max-w-full object-contain opacity-80" />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <p className="text-lg font-medium">Página não encontrada</p>
        <p className="text-sm text-muted-foreground">A página que você está procurando não existe ou foi movida.</p>
      </div>
      <Link to="/" className={buttonVariants({ variant: "default" })}>
        Voltar ao início
      </Link>
    </div>
  );
}

function RootComponent() {
  return (
    <>
      <HeadContent />
      {/* <TooltipProvider> */}
      <Outlet />
      {/* </TooltipProvider> */}
      <Toaster richColors />
    </>
  );
}
