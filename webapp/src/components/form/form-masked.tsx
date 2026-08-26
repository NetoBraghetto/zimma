import { type FormatGeneralOptions, formatGeneral } from "cleave-zen";
import { type ReactNode, useRef } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface FormMaskedProps<F extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
  options: FormatGeneralOptions;
}

function FormMasked<F extends FieldValues>({ label, name, control, help, error, options, ...props }: FormMaskedProps<F>): ReactNode {
  const inputRef = useRef(null);
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const id = props.id || `input-masked-${field.name}`;
  const isInvalid = !!err;
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <Input
        ref={inputRef}
        type="text"
        {...props}
        id={id}
        onBlur={field.onBlur}
        name={field.name}
        value={field.value || ""}
        aria-invalid={isInvalid}
        onChange={(e) => {
          field.onChange(formatGeneral(e.target.value, options));
        }}
      />
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}
export { FormMasked };
