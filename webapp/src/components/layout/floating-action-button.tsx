import { Link } from "@tanstack/react-router";
import { TbPlus, TbTrendingDown, TbTrendingUp } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function FloatingActionButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon" className="size-12 rounded-full shadow-lg">
              <TbPlus className="size-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" side="left">
          <DropdownMenuItem
            render={
              <Link to="/despesas/nova" className="cursor-pointer gap-2 py-2">
                <TbTrendingDown className="h-4 w-4 text-destructive" />
                <span>Despesa</span>
              </Link>
            }
          ></DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => console.log("Income clicked")}>
            <TbTrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Receita</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
