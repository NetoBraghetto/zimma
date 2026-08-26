import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/")({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Dashboard" }],
  }),
  // beforeLoad() {
  //   throw redirect({
  //     from: "/",
  //     to: "/questoes",
  //   });
  // },
});

function RouteComponent() {
  return null;
}
