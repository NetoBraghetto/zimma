const dateFormater = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
});
const timeFormater = new Intl.DateTimeFormat("pt-BR", {
  timeStyle: "short",
});

export function DateTimeFormatter(date?: string | null, time: boolean = true, defaultValue: string = ""): string {
  if (typeof date !== "string") {
    return defaultValue;
  }

  const d = new Date(date);
  return `${dateFormater.format(d)} às ${time ? timeFormater.format(d) : ""}`;
}
