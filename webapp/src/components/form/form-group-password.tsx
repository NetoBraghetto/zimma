import type { ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export interface FormGroupPasswordProps<F extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
  addons?: ReactNode[];
}

export function FormGroupPassword<F extends FieldValues>({
  label,
  name,
  control,
  help,
  error,
  addons,
  ...props
}: FormGroupPasswordProps<F>): ReactNode {
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const id = props.id || `input-password-${field.name}`;
  const isInvalid = !!err;
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <InputGroup>
        <InputGroupInput
          type="password"
          {...props}
          id={id}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          value={field.value || ""}
          aria-invalid={isInvalid}
        />
        {addons?.length
          ? addons.map((addon, index) => {
              return <InputGroupAddon key={index}>{addon}</InputGroupAddon>;
            })
          : null}
      </InputGroup>
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}
