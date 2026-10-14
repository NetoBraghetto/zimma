import type {
  FinancialRecordRecurrenceIntervalValue,
  FinancialRecordRecurrenceValue,
  FinancialRecordTypeValue,
} from "@/constants/financial-record";
import type { SqlDateTimeFormat } from "@/lib/ts-helpers";
import { type NewResource, RestfulService } from "@/services/restful-service";
import type { TagModel } from "@/services/tag-service";

export interface NewFinancialRecordModel extends NewResource {
  name: string;
  amount: string;
  due_date: string;
  purchase_date: string | null;
  type: FinancialRecordTypeValue;
  confirmed: boolean;
  recurrence_id: FinancialRecordRecurrenceValue;
  interval_id: FinancialRecordRecurrenceIntervalValue | null;
  interval_days?: number | null;
  repeat_count?: number | null;
  tags: number[];
}

export interface FinancialRecordSerieModel {
  readonly id: number;
  readonly recurrence: FinancialRecordRecurrenceValue;
  readonly repeat_count: number | null;
}

export interface FinancialRecordModel extends Omit<NewFinancialRecordModel, "tags"> {
  readonly id: number;
  readonly series_id: number | null;
  readonly installment: number | null;
  readonly amount: string;
  readonly confirmed_at: string | null;
  readonly vendor: string | null;
  readonly vendor_source: string | null;
  readonly vendor_id: string | null;
  readonly vendor_name: string | null;
  readonly serie?: FinancialRecordSerieModel;
  readonly tags: TagModel[];
  readonly created_at: SqlDateTimeFormat;
  readonly updated_at: SqlDateTimeFormat;
}

export type FinancialRecordFormDependencies = {
  tags: TagModel[];
};

class FinancialRecordService extends RestfulService<FinancialRecordModel, FinancialRecordFormDependencies> {
  protected path = "financial-record";
}

export const financialRecordService = new FinancialRecordService();
