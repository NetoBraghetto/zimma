import { isBefore, startOfDay } from "date-fns";
import type { ReactNode } from "react";
import { TbAlertTriangle, TbCircleCheck, TbClock } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import type { FinancialRecordModel } from "@/services/financial-record-service";

type FinancialRecordStatusBadgeProps = {
  item: Pick<FinancialRecordModel, "confirmed_at" | "due_date">;
};

export function FinancialRecordStatusBadge({ item }: FinancialRecordStatusBadgeProps): ReactNode {
  if (item.confirmed_at) {
    return (
      <Badge variant="blue" size="sm">
        <TbCircleCheck />
        Confirmado
      </Badge>
    );
  }

  if (isBefore(new Date(item.due_date), startOfDay(new Date()))) {
    return (
      <Badge variant="yellow" size="sm">
        <TbAlertTriangle />
        Atrasado
      </Badge>
    );
  }

  return (
    <Badge variant="gray" size="sm">
      <TbClock />
      Pendente
    </Badge>
  );
}
