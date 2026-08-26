import type { ValueOf } from "@/lib/ts-helpers";

export const DocumentType = {
  CPF: 1,
  CNPJ: 2,
} as const;

export const DocumentTypeList = [
  { name: "CPF", id: DocumentType.CPF, alias: "Pessoa física" },
  { name: "CNPJ", id: DocumentType.CNPJ, alias: "Pessoa jurídica" },
];

export const DocumentTypeMap = {
  [DocumentType.CPF]: {
    name: "CPF",
    id: DocumentType.CPF,
    alias: "Pessoa física",
  },
  [DocumentType.CNPJ]: {
    name: "CNPJ",
    id: DocumentType.CNPJ,
    alias: "Pessoa jurídica",
  },
};

export type DocumentTypeValue = ValueOf<typeof DocumentType>;
