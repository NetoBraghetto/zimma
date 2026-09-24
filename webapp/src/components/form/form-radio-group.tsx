import type { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface FormRadioGroupProps<F extends FieldValues, O> extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
  options: O[];
  getOptionLabel?: (option: O) => ReactNode;
  getOptionValue?: (option: O) => string | number;
}

function FormRadioGroup<
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
  options,
  getOptionLabel = (option: O) => option.name as string,
  getOptionValue = (option: O) => option.id as string,
  ...props
}: FormRadioGroupProps<F, O>): ReactNode {
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const id = props.id || `input-text-${field.name}`;
  const isInvalid = !!err;
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <RadioGroup onValueChange={field.onChange} name={field.name} className="flex flex-wrap" defaultValue={field.value} {...props}>
        {options.map((option) => {
          const value = getOptionValue(option);
          const id = `input-radio-option-${name}-${value}`;
          return (
            <div key={value} className="flex items-center space-x-2">
              <RadioGroupItem value={value} id={id} />
              <Label className="cursor-pointer" htmlFor={id}>
                {getOptionLabel(option)}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}

export { FormRadioGroup };
