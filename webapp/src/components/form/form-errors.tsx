import { AxiosError } from "axios";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

export function FormErrors(error: unknown, setError?: UseFormSetError<any>): void {
  if (error instanceof AxiosError) {
    if (error.status === 422) {
      const validationErrors = [];
      for (const f in error.response?.data.errors) {
        const message = error.response?.data.errors[f][0] || "";
        validationErrors.push(<li key={f}>{message}</li>);
        if (setError) {
          setError(f, {
            type: "server",
            message,
          });
        }
      }
      toast.error("Verifique os dados", {
        description: <ul className="grid gap-2 list-disc list-inside">{validationErrors}</ul>,
      });
    }
  }
}
