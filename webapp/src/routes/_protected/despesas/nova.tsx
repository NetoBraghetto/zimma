import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { FinancialRecordForm } from "@/components/resources/financial-record/form";

export const Route = createFileRoute("/_protected/despesas/nova")({
  head: () => ({
    meta: [{ title: "Novo Despesa" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  return (
    <div>
      <FinancialRecordForm
        onSave={() => {
          toast.success("Despesa criado!");
          navigate({ to: `/despesas` });
        }}
      />
    </div>
  );
}
