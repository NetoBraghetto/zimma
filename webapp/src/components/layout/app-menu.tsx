import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { IconType } from "react-icons";
import { TbLayoutDashboard, TbMenu2, TbTag, TbTrendingDown, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import Config from "@/services/config-service";

type MenuItem = {
  to: "/dashboard" | "/despesas" | "/tags";
  label: string;
  icon: IconType;
};

const menuItems: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: TbLayoutDashboard },
  { to: "/despesas", label: "Despesas", icon: TbTrendingDown },
  { to: "/tags", label: "Tags", icon: TbTag },
];

export function AppMenu() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button variant="ghost" size="icon" aria-label="Abrir menu">
            <TbMenu2 aria-hidden="true" className="size-6 text-primary" />
          </Button>
        }
      />
      <DialogPrimitive.Portal>
        {/* Transitions (not keyframe animations) so base-ui keeps the end state until unmount, avoiding a flash on close */}
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[calc(100%-3rem)] flex-col bg-card shadow-lg ring-1 ring-foreground/10 transition-transform duration-200 outline-none data-ending-style:-translate-x-full data-starting-style:-translate-x-full">
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            <DialogPrimitive.Title className="font-heading text-base font-semibold tracking-wider text-primary uppercase">
              {Config.get("APP_NAME")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Fechar menu">
                  <TbX className="size-5" />
                </Button>
              }
            />
          </div>
          <nav className="flex flex-col gap-1 p-2">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-muted font-semibold text-foreground" }}
              >
                <item.icon aria-hidden="true" className="size-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
