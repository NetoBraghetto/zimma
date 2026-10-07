import { type ReactNode, useEffect } from "react";
import { useController, useForm } from "react-hook-form";
import { Form } from "@/components/form/form";
import { FormErrors } from "@/components/form/form-errors";
import { FormText } from "@/components/form/form-text";
import { Submit } from "@/components/form/submit";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { DEFAULT_TAG_COLOR } from "@/constants/tag";
import type { SucessServerResponse } from "@/lib/format-success-response";
import { type NewTagModel, type TagModel, tagService } from "@/services/tag-service";
import { TagBadge } from "./tag-badge";
import { TagIconPicker } from "./tag-icon-picker";

type TagFormProps = {
  id?: string;
  onSave?: (response: SucessServerResponse<TagModel>) => void;
};

export function TagForm({ id, onSave }: TagFormProps): ReactNode {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm<NewTagModel>({
    defaultValues: {
      name: "",
      color: DEFAULT_TAG_COLOR,
      icon: "",
    },
  });
  const { field: colorField } = useController({ name: "color", control });
  const { field: iconField } = useController({ name: "icon", control });
  const name = watch("name");

  useEffect(() => {
    async function request() {
      if (!id) {
        return;
      }

      try {
        const { data } = await tagService.show(id);
        reset({ name: data.name, color: data.color, icon: data.icon });
      } catch (_error) {}
    }
    request();
  }, [id, reset]);

  async function onSubmit(values: NewTagModel) {
    if (isSubmitting) {
      return;
    }

    try {
      const response = await tagService.save({ name: values.name, color: values.color, icon: values.icon }, id);
      if (onSave) {
        onSave(response);
      }
    } catch (error) {
      FormErrors(error, setError);
    }
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grid w-full items-start gap-6">
      <FieldSet>
        <FieldLegend>Tag</FieldLegend>
        <FormText label="Nome" name="name" maxLength={50} error={errors.name} control={control} />
        <Field data-invalid={!!errors.color}>
          <FieldLabel htmlFor="input-color-color">Cor</FieldLabel>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="input-color-color"
              className="h-10 w-16 cursor-pointer border border-input bg-white p-1"
              name={colorField.name}
              value={colorField.value}
              onChange={(event) => colorField.onChange(event.target.value)}
              onBlur={colorField.onBlur}
              aria-invalid={!!errors.color}
            />
            <span className="font-mono text-sm text-muted-foreground uppercase">{colorField.value}</span>
          </div>
          {errors.color ? <FieldError>{errors.color.message}</FieldError> : null}
        </Field>
        <Field data-invalid={!!errors.icon}>
          <FieldLabel htmlFor="input-icon-icon">Ícone</FieldLabel>
          <TagIconPicker id="input-icon-icon" value={iconField.value} onChange={iconField.onChange} invalid={!!errors.icon} />
          {errors.icon ? <FieldError>{errors.icon.message}</FieldError> : null}
        </Field>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Prévia:
          <TagBadge name={name || "Nome da tag"} color={colorField.value} icon={iconField.value} />
        </div>
        <div className="flex justify-end gap-4">
          <Submit onClick={() => clearErrors()} isLoading={isSubmitting}>
            Salvar
          </Submit>
        </div>
      </FieldSet>
    </Form>
  );
}
