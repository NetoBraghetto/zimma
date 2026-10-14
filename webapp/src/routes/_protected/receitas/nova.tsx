import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { FinancialRecordForm } from "@/components/resources/financial-record/form";
import { FinancialRecordType } from "@/constants/financial-record";

export const Route = createFileRoute("/_protected/receitas/nova")({
  head: () => ({
    meta: [{ title: "Nova Receita" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  return (
    <div>
      <FinancialRecordForm
        type={FinancialRecordType.INCOME}
        onSave={() => {
          toast.success("Receita criada!");
          navigate({ to: `/receitas` });
        }}
      />
    </div>
  );
}
