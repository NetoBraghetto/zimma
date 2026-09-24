import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge leading-1 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border-0 bg-transparent font-semibold tracking-widest whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "text-foreground [a]:hover:text-foreground/70",
        secondary: "text-muted-foreground [a]:hover:text-foreground",
        destructive:
          "text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:text-destructive/70",
        outline: "text-foreground [a]:hover:text-foreground/70",
        ghost: "text-muted-foreground hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        gray: "bg-gray-600/20 text-gray-800 ring-gray-600/20",
        red: "bg-red-50 text-red-700 ring-red-600/10",
        yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
        green: "bg-green-600/20 text-green-800 ring-green-600/20",
        blue: "bg-blue-600/20 text-blue-800 ring-blue-600/20",
        emerald: "bg-emerald-600/20 text-emerald-800 ring-emerald-600/20",
        indigo: "bg-indigo-50 text-indigo-700 ring-indigo-700/10",
        purple: "bg-purple-50 text-purple-700 ring-purple-700/10",
        pink: "bg-pink-50 text-pink-700 ring-pink-700/10",
        primary: "bg-primary-600/20 text-primary-800 ring-primary-600/20",
      },
      size: {
        sm: "text-[0.625rem] px-1 py-0.5",
        md: "text-[0.625rem] px-1.5 py-1",
        lg: "text-[0.75rem] px-1.5 py-0.5",
      },
      shape: {
        round: "rounded-lg",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "square",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size = "md",
  shape = "square",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size, shape }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
