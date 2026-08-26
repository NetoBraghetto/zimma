import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SubmitButtonProps extends ComponentProps<"button"> {
  isLoading?: boolean;
  children: ReactNode;
}

export function Submit({ isLoading, children, ...props }: SubmitButtonProps): ReactNode {
  let spinner = null;
  const submitProps = {
    ...props,
    className: "gap-2",
  };

  if (isLoading) {
    submitProps.disabled = true;
    submitProps["aria-disabled"] = true;
    submitProps["aria-busy"] = true;
    submitProps.className += " cursor-default opacity-60";
    spinner = <Spinner size="small" aria-hidden />;
  }

  return (
    <Button {...submitProps} type="submit">
      {spinner} {children}
    </Button>
  );
}
