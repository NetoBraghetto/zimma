import type { FinancialRecordTypeValue, PaymentMethodValue } from "@/constants/financial-record";
import { FormatSuccessResponse, type SucessServerResponse } from "@/lib/format-success-response";
import { api } from "@/services/http-client";
import type { TagModel } from "@/services/tag-service";

export const ImportSource = {
  ITAU_BANK_EXTRACT: "itau-bank-extract",
  ITAU_CC_EXTRACT: "itau-cc-extract",
  INTER_BANK_EXTRACT: "inter-bank-extract",
  INTER_CC_EXTRACT: "inter-cc-extract",
  NUBANK_CC_EXTRACT: "nubank-cc-extract",
} as const;

// Bank statements list entries that already happened, unlike credit card invoices.
export const BANK_EXTRACT_SOURCES: string[] = [ImportSource.ITAU_BANK_EXTRACT, ImportSource.INTER_BANK_EXTRACT];

export interface ImportedFinancialRecord {
  vendor: string;
  vendor_id: string;
  vendor_source: string;
  vendor_name: string;
  name: string;
  amount: string;
  type: FinancialRecordTypeValue;
  due_date: string;
  purchase_date: string;
  payment_method: PaymentMethodValue | null;
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
  purchase_date: string | null;
  payment_method: PaymentMethodValue | null;
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
