import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import Config from "@/services/config-service";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { AppMenu } from "./app-menu";

export function Header() {
  const { user } = useAuth();

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
        {user ? (
          <Avatar>
            <AvatarFallback>{user.name?.[0] ?? user.email[0]}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </header>
  );
}
