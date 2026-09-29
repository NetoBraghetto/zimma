import { addDays, addMonths, addWeeks, addYears, format, isValid } from "date-fns";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TbCurrencyReal } from "react-icons/tb";
import { Form } from "@/components/form/form";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormDate } from "@/components/form/form-date";
import { FormErrors } from "@/components/form/form-errors";
import { FormGroupMasked } from "@/components/form/form-group-masked";
import { FormRadioGroup } from "@/components/form/form-radio-group";
import { FormSelect } from "@/components/form/form-select";
import { FormTags } from "@/components/form/form-tags";
import { FormText } from "@/components/form/form-text";
import { Submit } from "@/components/form/submit";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { CleaveBRLOptions } from "@/constants/cleave-masks";
import {
  FinancialRecordRecurrence,
  FinancialRecordRecurrenceInterval,
  FinancialRecordRecurrenceIntervalList,
  type FinancialRecordRecurrenceIntervalValue,
  FinancialRecordRecurrenceList,
  type FinancialRecordTypeValue,
} from "@/constants/financial-record";
import type { SucessServerResponse } from "@/lib/format-success-response";
import { type FinancialRecordModel, financialRecordService, type NewFinancialRecordModel } from "@/services/financial-record-service";

type FinancialRecordFormProps = {
  id?: string;
  onSave?: (response: SucessServerResponse<FinancialRecordModel>) => void;
  type: FinancialRecordTypeValue;
};

type FormValues = NewFinancialRecordModel & {
  tags: { id: number; name: string }[];
  // value: string;
  // recurrence: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Converts the masked value ("1.234,56") to cents.
function parseCents(value: string): number {
  const amount = Number(value.replaceAll(".", "").replace(",", "."));
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

// Mirrors FinancialRecordSerie.OccurrenceDate on the API: always computed from the start date.
function occurrenceDate(start: Date, i: number, intervalId: number, intervalDays: number): Date {
  switch (intervalId) {
    case FinancialRecordRecurrenceInterval.DAILY:
      return addDays(start, i);
    case FinancialRecordRecurrenceInterval.WEEKLY:
      return addWeeks(start, i);
    case FinancialRecordRecurrenceInterval.MONTHLY:
      return addMonths(start, i);
    case FinancialRecordRecurrenceInterval.YEARLY:
      return addYears(start, i);
    case FinancialRecordRecurrenceInterval.CUSTOM:
      return addDays(start, intervalDays * i);
  }
  return start;
}

function intervalAdverb(intervalId: FinancialRecordRecurrenceIntervalValue, intervalDays: number): string {
  switch (intervalId) {
    case FinancialRecordRecurrenceInterval.DAILY:
      return "diariamente";
    case FinancialRecordRecurrenceInterval.WEEKLY:
      return "semanalmente";
    case FinancialRecordRecurrenceInterval.MONTHLY:
      return "mensalmente";
    case FinancialRecordRecurrenceInterval.YEARLY:
      return "anualmente";
    case FinancialRecordRecurrenceInterval.CUSTOM:
      return intervalDays === 1 ? "a cada dia" : `a cada ${intervalDays} dias`;
  }
}

export function FinancialRecordForm({ id, type, onSave }: FinancialRecordFormProps): ReactNode {
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
      type,
      confirmed: false,
      recurrence_id: FinancialRecordRecurrence.UNIQUE,
      interval_id: FinancialRecordRecurrenceInterval.MONTHLY,
      interval_days: null,
      repeat_count: null,
      tags: [],
    },
  });
  const [recurrenceId, intervalId, value, dueDate, repeatCount, intervalDays] = watch([
    "recurrence_id",
    "interval_id",
    "value",
    "due_date",
    "repeat_count",
    "interval_days",
  ]);
  const [installment, setInstallment] = useState<number | null>(null);

  useEffect(() => {
    async function request() {
      if (!id) {
        return;
      }

      try {
        const { data } = await financialRecordService.show(id);
        reset(data);
        setInstallment(data.installment);
      } catch (_error) {}
    }
    request();
  }, [id, reset]);

  async function onSubmit(values: FormValues) {
    if (isSubmitting) {
      return;
    }

    try {
      const recurrenceValue = Number(values.recurrence_id) as FormValues["recurrence_id"];
      const intervalValue = Number(values.interval_id) as FormValues["interval_id"];
      const isUnique = recurrenceValue === FinancialRecordRecurrence.UNIQUE;
      const payload: FormValues = {
        ...values,
        type,
        recurrence_id: recurrenceValue,
        interval_id: isUnique ? null : intervalValue,
        interval_days: !isUnique && intervalValue === FinancialRecordRecurrenceInterval.CUSTOM ? Number(values.interval_days) : null,
        repeat_count:
          [FinancialRecordRecurrence.REPEAT, FinancialRecordRecurrence.SPLITED].indexOf(recurrenceValue) > -1
            ? Number(values.repeat_count)
            : null,
      };
      const response = await financialRecordService.save(payload, id);
      if (onSave) {
        onSave(response);
      }
    } catch (error) {
      FormErrors(error, setError);
    }
  }

  function renderRecurrenceOptions() {
    const recId = Number(recurrenceId);
    if (recId === FinancialRecordRecurrence.UNIQUE) {
      return null;
    }

    return (
      <>
        {[FinancialRecordRecurrence.REPEAT, FinancialRecordRecurrence.SPLITED].indexOf(recId) !== -1 ? (
          <FormText label="Quantidade de vezes" name="repeat_count" type="number" min={2} error={errors.repeat_count} control={control} />
        ) : null}
        <FormSelect
          label="Frequência"
          name="interval_id"
          error={errors.interval_id}
          control={control}
          options={FinancialRecordRecurrenceIntervalList}
        />
        {Number(intervalId) === FinancialRecordRecurrenceInterval.CUSTOM ? (
          <FormText
            label="Repetir a cada (dias)"
            name="interval_days"
            type="number"
            min={1}
            error={errors.interval_days}
            control={control}
          />
        ) : null}
      </>
    );
  }

  function renderRecurrenceDescription() {
    const recId = Number(recurrenceId);
    const intId = Number(intervalId) as FinancialRecordRecurrenceIntervalValue;
    const days = Math.max(Number(intervalDays) || 1, 1);
    const totalCents = parseCents(value ?? "");

    if (recId === FinancialRecordRecurrence.UNIQUE) {
      return <p className="text-sm text-muted-foreground">Uma parcela de {formatCents(totalCents)}</p>;
    }

    if (recId === FinancialRecordRecurrence.RECURRING) {
      return (
        <p className="text-sm text-muted-foreground">
          {formatCents(totalCents)} {intervalAdverb(intId, days)}
        </p>
      );
    }

    const count = Number(repeatCount);
    if (!Number.isInteger(count) || count < 2) {
      return null;
    }

    // SPLITED divides the total; leftover cents go to the first installment so the sum matches.
    const isSplited = recId === FinancialRecordRecurrence.SPLITED;
    const baseCents = isSplited ? Math.floor(totalCents / count) : totalCents;
    const remainderCents = isSplited ? totalCents - baseCents * count : 0;
    const start = dueDate ? new Date(dueDate) : null;
    const hasStart = start !== null && isValid(start);
    const installments = Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      date: hasStart ? format(occurrenceDate(start, i, intId, days), "dd/MM/yyyy") : null,
      cents: i === 0 ? baseCents + remainderCents : baseCents,
    }));

    return (
      <div className="text-sm text-muted-foreground">
        <p>
          {count} parcelas de {formatCents(baseCents)}
        </p>
        <ul className="mt-2 max-h-48 list-disc overflow-y-auto pl-5">
          {installments.map((installment) => (
            <li key={installment.number}>
              Parcela {installment.number}: {installment.date ? `${installment.date} - ` : ""}
              {formatCents(installment.cents)}
            </li>
          ))}
        </ul>
      </div>
    );
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
        {id ? (
          installment ? (
            <p className="text-sm text-muted-foreground">Parcela {installment}</p>
          ) : null
        ) : (
          <>
            <FormRadioGroup
              label="Recorrência"
              name="recurrence_id"
              control={control}
              error={errors.recurrence_id}
              options={FinancialRecordRecurrenceList}
            />
            {renderRecurrenceOptions()}
            {renderRecurrenceDescription()}
          </>
        )}
        <FormDate label="Vencimento" name="due_date" control={control} error={errors.due_date} />
        <FormCheckbox label="Confirmado" name="confirmed" control={control} />
        <FormTags label="Tags" name="tags" control={control} options={[]} />
        <div className="flex justify-end gap-4">
          <Submit onClick={() => clearErrors()} isLoading={isSubmitting}>
            Salvar
          </Submit>
        </div>
      </FieldSet>
    </Form>
  );
}
