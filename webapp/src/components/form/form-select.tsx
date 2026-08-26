import type { ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export interface FormSelectProps<F extends FieldValues, O> extends React.InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
  disabled?: boolean;
  required?: boolean;
  options: readonly O[];
  getOptionLabel?: (option: O) => ReactNode;
  getOptionValue?: (option: O) => string | number;
}

function FormSelect<
  F extends FieldValues,
  O extends { id: number | string; name: string } = {
    id: number;
    name: string;
  },
>({
  label,
  name,
  control,
  help,
  error,
  disabled,
  required,
  options,
  getOptionLabel = (option: O) => option.name as string,
  getOptionValue = (option: O) => option.id as string,
  ...props
}: FormSelectProps<F, O>): ReactNode {
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const id = props.id || `input-text-${field.name}`;
  const isInvalid = !!err;
  const value = field.value?.toString() || "";
  return (
    <Field data-invalid={isInvalid}>
      {label ? (
        <FieldLabel htmlFor={id}>
          {label}
          {required ? <span className="text-red-400"> *</span> : ""}
        </FieldLabel>
      ) : null}
      <NativeSelect
        id={id}
        defaultValue={value}
        name={field.name}
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        aria-disabled={disabled}
        disabled={disabled}
        aria-invalid={isInvalid}
        aria-required={required}
        {...props}
        size="default"
      >
        <NativeSelectOption className="first:text-muted-foreground" value="">
          {props.placeholder}
        </NativeSelectOption>
        {options.map((option) => {
          const opValue = getOptionValue(option).toString();
          return (
            <NativeSelectOption key={opValue} value={opValue}>
              {getOptionLabel(option)}
            </NativeSelectOption>
          );
        })}
      </NativeSelect>
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}
export { FormSelect };
