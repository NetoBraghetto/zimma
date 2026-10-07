import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { TagForm } from "@/components/resources/tag/form";

export const Route = createFileRoute("/_protected/tags/$tagId/alterar")({
  head: () => ({
    meta: [{ title: "Alterar Tag" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const navigate = Route.useNavigate();
  return (
    <div>
      <TagForm
        id={params.tagId}
        onSave={() => {
          toast.success("Tag alterada!");
          navigate({ to: "/tags" });
        }}
      />
    </div>
  );
}
