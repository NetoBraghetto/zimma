import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { FinancialRecordForm } from "@/components/resources/financial-record/form";
import { FinancialRecordType } from "@/constants/financial-record";

export const Route = createFileRoute("/_protected/despesas/$financialRecordId/alterar")({
  head: () => ({
    meta: [{ title: "Alterar Despesa" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return (
    <div>
      <FinancialRecordForm
        id={params.financialRecordId}
        type={FinancialRecordType.EXPENSE}
        onSave={() => {
          toast.success("Despesa alterada!");
        }}
      />
    </div>
  );
}
