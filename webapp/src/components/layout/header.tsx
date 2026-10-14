import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { TbLogout, TbUser } from "react-icons/tb";
import { ImportButton } from "@/components/resources/import/import-dialog";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/services/auth-service";
import Config from "@/services/config-service";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AppMenu } from "./app-menu";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleLogout() {
    authService.logout();
    queryClient.clear();
    navigate({ to: "/autenticacao/login", search: { redirect: "/" } });
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <AppMenu />
        <Link to="/dashboard" aria-label="Ir para o dashboard" className="outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <img src="/logo.svg" alt={Config.get("APP_NAME")} className="h-8 w-auto" />
        </Link>
        {/* <span className="text-base font-semibold tracking-tight text-primary">Dashboard Overview</span> */}
      </div>
      <div className="flex items-center gap-3">
        <ImportButton />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Abrir menu do usuário"
              className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Avatar>
                <AvatarFallback>{user.name?.[0] ?? user.email[0]}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="normal-case tracking-normal">
                  <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span>
                  <span className="block truncate font-normal">{user.email}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <Link to="/perfil" className="cursor-pointer gap-2">
                    <TbUser className="size-4" />
                    <span>Perfil</span>
                  </Link>
                }
              />
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleLogout}>
                <TbLogout className="size-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
