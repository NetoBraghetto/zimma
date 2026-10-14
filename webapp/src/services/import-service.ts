import type { FinancialRecordTypeValue } from "@/constants/financial-record";
import { FormatSuccessResponse, type SucessServerResponse } from "@/lib/format-success-response";
import { api } from "@/services/http-client";
import type { TagModel } from "@/services/tag-service";

export const ImportSource = {
  ITAU_BANK_EXTRACT: "itau-bank-extract",
  ITAU_CC_EXTRACT: "itau-cc-extract",
} as const;

export interface ImportedFinancialRecord {
  vendor: string;
  vendor_id: string;
  vendor_source: string;
  vendor_name: string;
  name: string;
  amount: string;
  type: FinancialRecordTypeValue;
  due_date: string;
  suggested_tags: TagModel[];
  already_imported: boolean;
}

export interface ImportPreview {
  source: string;
  source_label: string;
  records: ImportedFinancialRecord[];
}

export interface ImportRecordPayload {
  name: string;
  amount: string;
  type: FinancialRecordTypeValue;
  due_date: string;
  confirmed: boolean;
  tags: number[];
  vendor: string;
  vendor_source: string;
  vendor_id: string;
  vendor_name: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

class ImportService {
  async preview(file: File): Promise<SucessServerResponse<ImportPreview>> {
    const data = new FormData();
    data.append("file", file);
    const response = await api.post("import/preview", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return FormatSuccessResponse(response);
  }

  async store(records: ImportRecordPayload[]): Promise<SucessServerResponse<ImportResult>> {
    const response = await api.post("import", { records });
    return FormatSuccessResponse(response);
  }
}

export const importService = new ImportService();
