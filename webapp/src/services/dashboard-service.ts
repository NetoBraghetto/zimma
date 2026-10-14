import { FormatSuccessResponse, type SucessServerResponse } from "@/lib/format-success-response";
import type { FinancialRecordModel } from "@/services/financial-record-service";
import { api } from "@/services/http-client";

export type DashboardModel = {
  incomes: FinancialRecordModel[];
  expenses: FinancialRecordModel[];
  previous_month_total_income: string;
  previous_month_total_expense: string;
};

class DashboardService {
  get(month: string): Promise<SucessServerResponse<DashboardModel>> {
    return api
      .get("dashboard", { params: { month } })
      .then((response) => FormatSuccessResponse<DashboardModel, Record<string, never>>(response));
  }
}

export const dashboardService = new DashboardService();
