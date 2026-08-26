import type { SqlDateTimeFormat } from "@/lib/ts-helpers";
import { type NewResource, RestfulService } from "@/services/restful-service";

export interface NewFinancialRecordModel extends NewResource {
  name: string;
}

export interface FinancialRecordModel extends NewFinancialRecordModel {
  readonly id: number;
  readonly slug: string;
  readonly uuid: string;
  readonly created_at: SqlDateTimeFormat;
  readonly updated_at: SqlDateTimeFormat;
}

class ProjectService extends RestfulService<FinancialRecordModel> {
  protected path = "financial-records";
}

export const projectService = new ProjectService();
