import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { FinancialRecordForm } from "@/components/resources/financial-record/form";
import { FinancialRecordType } from "@/constants/financial-record";

export const Route = createFileRoute("/_protected/despesas/nova")({
  head: () => ({
    meta: [{ title: "Nova Despesa" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  return (
    <div>
      <FinancialRecordForm
        type={FinancialRecordType.EXPENSE}
        onSave={() => {
          toast.success("Despesa criado!");
          navigate({ to: `/despesas` });
        }}
      />
    </div>
  );
}
