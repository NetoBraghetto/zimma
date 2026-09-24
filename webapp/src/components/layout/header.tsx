import { TbMenu2 } from "react-icons/tb";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Abrir menu">
          <TbMenu2 aria-hidden="true" className="size-6 text-primary" />
        </Button>
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
