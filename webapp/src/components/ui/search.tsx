import { type ChangeEvent, type ReactNode, useState } from "react";
import { TbSearch } from "react-icons/tb";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name?: string;
  q?: string | null;
  className?: string;
  onSearch: (q: string) => void;
}

let tmID: number;

export function Search({ onSearch, name = "q", q = "", ...props }: SearchProps): ReactNode {
  const [v, setV] = useState<string>(q || "");
  function debounce(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    window.clearTimeout(tmID);
    tmID = window.setTimeout(() => {
      onSearch(value);
    }, 300);
    setV(value);
  }
  return (
    <div className="relative flex-1 w-full">
      <TbSearch className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar"
        {...props}
        type="search"
        className={cn("w-full rounded-lg bg-background pl-8", props.className)}
        onChange={debounce}
        value={v}
        name={name}
      />
    </div>
  );
}
