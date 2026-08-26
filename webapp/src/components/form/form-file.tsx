import type { ChangeEvent, ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface FormFileProps<F extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
}

export function FormFile<F extends FieldValues>({ label, name, control, help, error, ...props }: FormFileProps<F>): ReactNode {
  const { field } = useController({
    name,
    control,
  });
  const err = error?.message;
  const id = props.id || `input-file-${field.name}`;
  const isInvalid = !!err;

  function onValueChange(event: ChangeEvent<HTMLInputElement>) {
    field.onChange(event.target.files);
  }
  if (field.value === null || field.value === undefined) {
    props.value = "";
  }
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <Input type="file" {...props} id={id} onChange={onValueChange} onBlur={field.onBlur} name={field.name} aria-invalid={isInvalid} />
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}
