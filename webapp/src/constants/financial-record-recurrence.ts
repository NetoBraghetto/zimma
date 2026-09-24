import type { ValueOf } from "@/lib/ts-helpers";

export const FinancialRecordRecurrence = {
  UNIQUE: 1,
  monthly: 2,
  RECURRING: 3,
} as const;

export const FinancialRecordRecurrenceList = [
  { name: "Parcela única", id: FinancialRecordRecurrence.UNIQUE },
  { name: "Repete", id: FinancialRecordRecurrence.monthly },
  { name: "Recorrente", id: FinancialRecordRecurrence.RECURRING },
];

// export const FinancialRecordRecurrenceMap = {
//   [FinancialRecordRecurrence.CPF]: {
//     name: "CPF",
//     id: FinancialRecordRecurrence.CPF,
//     alias: "Pessoa física",
//   },
//   [FinancialRecordRecurrence.CNPJ]: {
//     name: "CNPJ",
//     id: FinancialRecordRecurrence.CNPJ,
//     alias: "Pessoa jurídica",
//   },
// };

export type FinancialRecordRecurrenceValue = ValueOf<typeof FinancialRecordRecurrence>;

// Interval

export const FinancialRecordRecurrenceInterval = {
  daily: 1,
  weekly: 2,
  monthly: 3,
  yearly: 4,
  custom: 5,
} as const;

export const FinancialRecordRecurrenceIntervalList = [
  { name: "Diário", id: FinancialRecordRecurrenceInterval.daily },
  { name: "Semanal", id: FinancialRecordRecurrenceInterval.weekly },
  { name: "Mensal", id: FinancialRecordRecurrenceInterval.monthly },
  { name: "Anual", id: FinancialRecordRecurrenceInterval.yearly },
  { name: "Personalizado", id: FinancialRecordRecurrenceInterval.custom },
];

export type FinancialRecordRecurrenceIntervalValue = ValueOf<typeof FinancialRecordRecurrenceInterval>;
