import type { ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";

export interface FormCheckboxProps<F extends FieldValues> extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
}

function FormCheckbox<F extends FieldValues>({ label, name, control, help, error, ...props }: FormCheckboxProps<F>): ReactNode {
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const id = props.id || `input-checkbox-${field.name}`;
  const isInvalid = !!err;
  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <Checkbox
        {...props}
        id={id}
        onCheckedChange={field.onChange}
        onBlur={field.onBlur}
        name={field.name}
        checked={field.value || false}
        aria-invalid={isInvalid}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {help ? <FieldDescription>{help}</FieldDescription> : null}
        {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
      </FieldContent>
    </Field>
  );
}
export { FormCheckbox };
