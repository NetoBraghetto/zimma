import type { ReactNode } from "react";
import MonogramPath from "@/assets/images/monogram.svg?url";
import Config from "@/services/config-service";

type AuthCardProps = {
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Card layout shared by the authentication pages, matching the login screen.
 */
export function AuthCard({ description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-white p-8 shadow-sm">
      <div className="mx-auto w-fit rounded-full border bg-muted p-3">
        <img src={MonogramPath} alt={Config.get("APP_NAME")} className="mx-auto size-8" />
      </div>

      <div className="mt-4 grid gap-2 text-center">
        <span className="text-2xl font-extrabold text-primary">{Config.get("APP_NAME")}</span>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-6">{children}</div>

      {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
