import { type ChangeEvent, type ReactNode, useState } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { TbPlus, TbX } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export interface FormTagsProps<F extends FieldValues, O> extends Omit<React.InputHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
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

function FormTags<
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
  options = [],
  getOptionLabel = (option: O) => option.name as string,
  getOptionValue = (option: O) => option.id as string,
  ...props
}: FormTagsProps<F, O>): ReactNode {
  const { field } = useController({
    name,
    control,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const err = error?.message;
  const id = props.id || `input-tags-${field.name}`;
  const isInvalid = !!err;
  const values: Array<string | number> = Array.isArray(field.value) ? field.value : [];
  const selectedValues = values.map((value) => value.toString());
  const selecteds = options.filter((option) => selectedValues.includes(getOptionValue(option).toString()));
  const available = options.filter((option) => !selectedValues.includes(getOptionValue(option).toString()));

  function onSelect(e: ChangeEvent<HTMLSelectElement>) {
    const option = options.find((o) => getOptionValue(o).toString() === e.target.value);
    if (!option) {
      return;
    }
    field.onChange([...values, getOptionValue(option)]);
  }

  function onRemove(option: O) {
    const value = getOptionValue(option).toString();
    field.onChange(values.filter((v) => v.toString() !== value));
  }

  return (
    <Field data-invalid={isInvalid}>
      {label ? (
        <FieldLabel htmlFor={id}>
          {label}
          {required ? <span className="text-red-400"> *</span> : ""}
        </FieldLabel>
      ) : null}
      <div className="flex gap-2">
        <NativeSelect
          id={id}
          name={field.name}
          value=""
          onChange={onSelect}
          onBlur={field.onBlur}
          aria-disabled={disabled}
          disabled={disabled}
          aria-invalid={isInvalid}
          aria-required={required}
          {...props}
          className="flex-1"
          size="default"
        >
          <NativeSelectOption className="first:text-muted-foreground" value="">
            {props.placeholder}
          </NativeSelectOption>
          {available.map((option) => {
            const opValue = getOptionValue(option).toString();
            return (
              <NativeSelectOption key={opValue} value={opValue}>
                {getOptionLabel(option)}
              </NativeSelectOption>
            );
          })}
        </NativeSelect>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Button type="button" variant="outline" size="icon" disabled={disabled} onClick={() => setIsModalOpen(true)} aria-label="Novo">
            <TbPlus />
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      {selecteds.length ? (
        <div className="flex flex-wrap gap-1">
          {selecteds.map((option) => {
            const opValue = getOptionValue(option).toString();
            return (
              <Badge key={opValue} variant="gray" size="lg">
                {getOptionLabel(option)}
                <button
                  type="button"
                  className="cursor-pointer hover:text-destructive"
                  onClick={() => onRemove(option)}
                  disabled={disabled}
                  aria-label="Remover"
                >
                  <TbX />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}

export { FormTags };
