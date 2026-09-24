import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ReactNode } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { TbChevronDown } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface FormDateProps<F extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
}

export function FormDate<F extends FieldValues>({ label, name, control, help, error, ...props }: FormDateProps<F>): ReactNode {
  const { field } = useController({
    name,
    control,
  });

  const err = error?.message;
  const id = props.id || `input-date-${field.name}`;
  const isInvalid = !!err;
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant={"outline"}
              data-empty={!field.value}
              className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
            >
              {field.value ? format(field.value, "dd/MM/yyyy - EEEE", { locale: ptBR }) : <span>Selecione uma data</span>}
              <TbChevronDown data-icon="inline-end" />
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} />
        </PopoverContent>
      </Popover>
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}
