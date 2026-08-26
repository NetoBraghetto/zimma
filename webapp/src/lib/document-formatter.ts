import { DocumentType, type DocumentTypeValue } from "@/constants/document-type";

function MaskCNPJ(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function MaskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function DocumentFormatter(value: string, type: DocumentTypeValue): string {
  switch (type) {
    case DocumentType.CPF:
      return MaskCPF(value);
    case DocumentType.CNPJ:
      return MaskCNPJ(value);
    default:
      return value;
  }
}
