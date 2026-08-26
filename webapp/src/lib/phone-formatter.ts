export function PhoneFormatter(value?: string): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}
