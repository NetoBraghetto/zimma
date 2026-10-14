import Decimal from "decimal.js";

// Converts the masked BRL value ("1.234,56") to the decimal string the API expects ("1234.56").
export function BRLToDecimal(value?: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    return "0";
  }

  try {
    return new Decimal(value.replaceAll(".", "").replace(",", ".")).toFixed(2);
  } catch (_error) {
    return "0";
  }
}

// Converts the API decimal ("1234.5") to the masked BRL value ("1.234,50").
export function DecimalToBRL(value?: string | number): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  try {
    const [integer, fraction] = new Decimal(value).toFixed(2).split(".");
    return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction}`;
  } catch (_error) {
    return "";
  }
}
