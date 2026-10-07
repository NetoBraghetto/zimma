import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/")({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Dashboard" }],
  }),
  beforeLoad() {
    throw redirect({
      from: "/",
      to: "/dashboard",
    });
  },
});

function RouteComponent() {
  return null;
}
