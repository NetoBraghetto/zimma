import { createFileRoute } from "@tanstack/react-router";
import { FinancialRecordList } from "@/components/resources/financial-record/list";
import { FinancialRecordType } from "@/constants/financial-record";

export const Route = createFileRoute("/_protected/receitas/")({
  head: () => ({
    meta: [{ title: "Receitas" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <FinancialRecordList type={FinancialRecordType.INCOME} />;
}
