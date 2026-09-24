import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { FinancialRecordForm } from "@/components/resources/financial-record/form";

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
        onSave={() => {
          toast.success("Despesa alterado!");
        }}
      />
    </div>
  );
}
