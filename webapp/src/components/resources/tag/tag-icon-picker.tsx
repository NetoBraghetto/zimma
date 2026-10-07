import { type ReactNode, useState } from "react";
import { TbBan, TbChevronDown, TbSearch } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagIcons } from "@/constants/tag-icons";
import { cn } from "@/lib/utils";

type TagIconPickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

// Ignores accents and case so "agua" finds "Água".
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function TagIconPicker({ id, value, onChange, invalid }: TagIconPickerProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = value ? TagIcons[value] : undefined;
  const SelectedIcon = selected?.icon ?? TbBan;
  const entries = Object.entries(TagIcons).filter(([, item]) => normalize(item.label).includes(normalize(q)));

  function select(key: string) {
    onChange(key);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQ("");
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button id={id} type="button" variant="outline" className="w-fit justify-start gap-2" aria-invalid={invalid}>
            <SelectedIcon aria-hidden="true" className={cn("size-5", !selected && "text-muted-foreground")} />
            <span>{selected?.label ?? "Sem ícone"}</span>
            <TbChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 gap-3">
        <div className="relative">
          <TbSearch aria-hidden="true" className="absolute top-3 left-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Buscar ícone" className="pl-8" value={q} onChange={(event) => setQ(event.target.value)} autoFocus />
        </div>
        <div className="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto">
          {q ? null : (
            <IconOption label="Sem ícone" selected={!value} onClick={() => select("")}>
              <TbBan className="size-5 text-muted-foreground" />
            </IconOption>
          )}
          {entries.map(([key, item]) => (
            <IconOption key={key} label={item.label} selected={value === key} onClick={() => select(key)}>
              <item.icon className="size-5" />
            </IconOption>
          ))}
        </div>
        {entries.length === 0 ? <p className="text-center text-muted-foreground">Nenhum ícone encontrado.</p> : null}
      </PopoverContent>
    </Popover>
  );
}

type IconOptionProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
};

function IconOption({ label, selected, onClick, children }: IconOptionProps): ReactNode {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "grid aspect-square place-items-center transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
        selected && "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {children}
    </button>
  );
}
