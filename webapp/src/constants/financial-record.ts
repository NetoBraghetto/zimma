import type { ValueOf } from "@/lib/ts-helpers";

// Recurrence

export const FinancialRecordRecurrence = {
  UNIQUE: 1,
  REPEAT: 2,
  RECURRING: 3,
  SPLITED: 4,
} as const;

export const FinancialRecordRecurrenceList = [
  { name: "Parcela única", id: FinancialRecordRecurrence.UNIQUE },
  { name: "Repete", id: FinancialRecordRecurrence.REPEAT },
  { name: "Recorrente", id: FinancialRecordRecurrence.RECURRING },
  { name: "Dividido", id: FinancialRecordRecurrence.SPLITED },
];

export type FinancialRecordRecurrenceValue = ValueOf<typeof FinancialRecordRecurrence>;

// Interval

export const FinancialRecordRecurrenceInterval = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  YEARLY: 4,
  CUSTOM: 5,
} as const;

export const FinancialRecordRecurrenceIntervalList = [
  { name: "Diário", id: FinancialRecordRecurrenceInterval.DAILY },
  { name: "Semanal", id: FinancialRecordRecurrenceInterval.WEEKLY },
  { name: "Mensal", id: FinancialRecordRecurrenceInterval.MONTHLY },
  { name: "Anual", id: FinancialRecordRecurrenceInterval.YEARLY },
  { name: "Personalizado", id: FinancialRecordRecurrenceInterval.CUSTOM },
];

export type FinancialRecordRecurrenceIntervalValue = ValueOf<typeof FinancialRecordRecurrenceInterval>;

// Type

export const FinancialRecordType = {
  INCOME: 1,
  EXPENSE: 2,
} as const;

export const FinancialRecordTypeList = [
  { name: "Receita", id: FinancialRecordType.INCOME },
  { name: "Despesa", id: FinancialRecordType.EXPENSE },
];

export type FinancialRecordTypeValue = ValueOf<typeof FinancialRecordType>;
