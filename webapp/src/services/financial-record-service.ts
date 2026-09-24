import type { FinancialRecordRecurrenceIntervalValue, FinancialRecordRecurrenceValue } from "@/constants/financial-record-recurrence";
import type { SqlDateTimeFormat } from "@/lib/ts-helpers";
import { type NewResource, RestfulService } from "@/services/restful-service";

export interface NewFinancialRecordModel extends NewResource {
  name: string;
  value: string;
  due_date: string;
  recurrence: FinancialRecordRecurrenceValue;
  interval: FinancialRecordRecurrenceIntervalValue;
}

export interface FinancialRecordModel extends NewFinancialRecordModel {
  readonly id: number;
  readonly created_at: SqlDateTimeFormat;
  readonly updated_at: SqlDateTimeFormat;
}

class FinancialRecordService extends RestfulService<FinancialRecordModel> {
  protected path = "financial-record";
}

export const financialRecordService = new FinancialRecordService();
