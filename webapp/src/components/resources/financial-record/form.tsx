import { type ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { TbCurrencyReal } from "react-icons/tb";
import { Form } from "@/components/form/form";
import { FormDate } from "@/components/form/form-date";
import { FormErrors } from "@/components/form/form-errors";
import { FormGroupMasked } from "@/components/form/form-group-masked";
import { FormRadioGroup } from "@/components/form/form-radio-group";
import { FormSelect } from "@/components/form/form-select";
import { FormText } from "@/components/form/form-text";
import { Submit } from "@/components/form/submit";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { CleaveBRLOptions } from "@/constants/cleave-masks";
import {
  FinancialRecordRecurrence,
  FinancialRecordRecurrenceIntervalList,
  FinancialRecordRecurrenceList,
} from "@/constants/financial-record-recurrence";
import type { SucessServerResponse } from "@/lib/format-success-response";
import { type FinancialRecordModel, financialRecordService, type NewFinancialRecordModel } from "@/services/financial-record-service";

type FinancialRecordFormProps = {
  id?: string;
  onSave?: (response: SucessServerResponse<FinancialRecordModel>) => void;
};

type FormValues = NewFinancialRecordModel & {
  tags: { id: number; name: string }[];
  // value: string;
  // recurrence: string;
};

export function FinancialRecordForm({ id, onSave }: FinancialRecordFormProps): ReactNode {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      value: "",
      due_date: "",
      recurrence: FinancialRecordRecurrence.UNIQUE,
      tags: [],
    },
  });
  const [recurrence, tags] = watch(["recurrence", "tags"]);

  useEffect(() => {
    async function request() {
      if (!id) {
        return;
      }

      try {
        const { data } = await financialRecordService.show(id);
        reset(data);
      } catch (_error) {}
    }
    request();
  }, [id, reset]);

  async function onSubmit(values: FormValues) {
    if (isSubmitting) {
      return;
    }

    try {
      const response = await financialRecordService.save(values, id);
      if (onSave) {
        onSave(response);
      }
    } catch (error) {
      FormErrors(error, setError);
    }
  }

  function renderRecurrenceOptions() {
    if (recurrence === FinancialRecordRecurrence.monthly) {
      return (
        <FormSelect
          label="Intervalo"
          name="interval"
          error={errors.interval}
          control={control}
          options={FinancialRecordRecurrenceIntervalList}
        />
      );
    }
    return null;
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grid w-full items-start gap-6">
      <FieldSet>
        <FieldLegend className="text-expense">Despesa</FieldLegend>
        <FormText label="Descrição" name="name" error={errors.name} control={control} />
        <FormGroupMasked
          label="Valor"
          name="value"
          control={control}
          error={errors.value}
          placeholder="0,00"
          options={CleaveBRLOptions}
          addons={[
            <div key="mail-addon" className="px-2">
              <TbCurrencyReal className="size-4" />
            </div>,
          ]}
        />
        <FormRadioGroup
          label="Recorrência"
          name="recurrence"
          control={control}
          error={errors.recurrence}
          options={FinancialRecordRecurrenceList}
        />
        {/* <FormMasked prefix="R$" label="Valor" name="value" error={errors.value} control={control} options={CleaveBRLOptions} /> */}
        {renderRecurrenceOptions()}
        <FormDate label="Vencimento" name="due_date" control={control} error={errors.due_date} />
        <div className="flex justify-end gap-4">
          <Submit onClick={() => clearErrors()} isLoading={isSubmitting}>
            Salvar
          </Submit>
        </div>
      </FieldSet>
    </Form>
  );
}
