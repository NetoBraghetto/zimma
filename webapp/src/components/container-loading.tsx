import { cva, type VariantProps } from "class-variance-authority";
import { TbDatabase } from "react-icons/tb";
import { cn } from "@/lib/utils";

type ContainerLoadingProps = {
  text?: string;
  className?: string;
  size?: string;
};

const variants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        xs: "size-8",
        default: "size-16",
        lg: "size-24",
        xl: "size-32",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export function ContainerLoading({ text, className, size }: ContainerLoadingProps & VariantProps<typeof variants>) {
  return (
    <div className={cn("grid place-items-center absolute inset-0 gap-6 animate-pulse z-10 bg-white/70", className)}>
      <div>
        <TbDatabase className={cn(variants({ size, className }))} />
        {/* <TbDatabase className={`size-${size} text-muted-foreground`} /> */}
      </div>
      {text ? <div className="uppercase font-black text-muted-foreground text-xl max-w-87.5 text-center">{text}</div> : null}
    </div>
  );
}
