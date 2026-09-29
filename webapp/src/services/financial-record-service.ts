import type {
  FinancialRecordRecurrenceIntervalValue,
  FinancialRecordRecurrenceValue,
  FinancialRecordTypeValue,
} from "@/constants/financial-record";
import type { SqlDateTimeFormat } from "@/lib/ts-helpers";
import { type NewResource, RestfulService } from "@/services/restful-service";

export interface NewFinancialRecordModel extends NewResource {
  name: string;
  value: string;
  due_date: string;
  type: FinancialRecordTypeValue;
  confirmed: boolean;
  recurrence_id: FinancialRecordRecurrenceValue;
  interval_id: FinancialRecordRecurrenceIntervalValue | null;
  interval_days?: number | null;
  repeat_count?: number | null;
}

export interface FinancialRecordModel extends NewFinancialRecordModel {
  readonly id: number;
  readonly series_id: number | null;
  readonly installment: number | null;
  readonly created_at: SqlDateTimeFormat;
  readonly updated_at: SqlDateTimeFormat;
}

class FinancialRecordService extends RestfulService<FinancialRecordModel> {
  protected path = "financial-record";
}

export const financialRecordService = new FinancialRecordService();
