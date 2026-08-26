import type { ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export interface FormTextareaProps<F extends FieldValues> extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
}

export function FormTextarea<F extends FieldValues>({ label, name, control, help, error, ...props }: FormTextareaProps<F>): ReactNode {
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const id = props.id || `input-textarea-${field.name}`;
  const isInvalid = !!err;
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <Textarea
        className="min-h-[9.5rem]"
        {...props}
        id={id}
        onChange={field.onChange}
        onBlur={field.onBlur}
        name={field.name}
        value={field.value || ""}
        aria-invalid={isInvalid}
      />
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}
