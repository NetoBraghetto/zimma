import { type FormatGeneralOptions, type FormatNumeralOptions, formatGeneral, formatNumeral } from "cleave-zen";
import { type ReactNode, useRef } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export interface FormGroupMaskedProps<F extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
  options: FormatGeneralOptions | FormatNumeralOptions;
  addons?: ReactNode[];
}

export function FormGroupMasked<F extends FieldValues>({
  label,
  name,
  control,
  help,
  error,
  options,
  addons,
  ...props
}: FormGroupMaskedProps<F>): ReactNode {
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
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          type="text"
          {...props}
          id={id}
          onBlur={field.onBlur}
          name={field.name}
          value={field.value || ""}
          aria-invalid={isInvalid}
          onChange={(e) => {
            if ("Inumeral" in options) {
              field.onChange(formatNumeral(e.target.value, options));
            } else if ("blocks" in options) {
              field.onChange(formatGeneral(e.target.value, options));
            }
          }}
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
