import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { TagForm } from "@/components/resources/tag/form";

export const Route = createFileRoute("/_protected/tags/nova")({
  head: () => ({
    meta: [{ title: "Nova Tag" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  return (
    <div>
      <TagForm
        onSave={() => {
          toast.success("Tag criada!");
          navigate({ to: "/tags" });
        }}
      />
    </div>
  );
}
