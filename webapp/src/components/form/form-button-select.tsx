import type { ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface FormButtonSelectProps<F extends FieldValues, O> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
  disabled?: boolean;
  options: readonly O[];
  toggleType?: "single" | "multiple";
  getOptionLabel?: (option: O) => string;
  getOptionValue?: (option: O) => string | number;
}

function FormButtonSelect<
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
  disabled = false,
  options,
  toggleType = "single",
  getOptionLabel = (option: O) => option.name as string,
  getOptionValue = (option: O) => option.id as string,
}: FormButtonSelectProps<F, O>): ReactNode {
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const isInvalid = !!err;
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <ToggleGroup
        variant="primary-outline"
        type={toggleType}
        onValueChange={(value: string | string[]) => field.onChange(value)}
        value={field.value}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {options.map((option) => {
          const opValue = getOptionValue(option).toString();
          const opLabel = getOptionLabel(option).toString();
          //  const isSelected = opValue === value;
          return (
            <ToggleGroupItem key={opValue} value={opValue} aria-label={opLabel}>
              {opLabel}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}
export { FormButtonSelect };
