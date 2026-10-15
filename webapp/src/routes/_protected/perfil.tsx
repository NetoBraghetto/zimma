import { createFileRoute } from "@tanstack/react-router";
import { SocialAccountsCard } from "@/components/resources/oauth/social-accounts-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_protected/perfil")({
  head: () => ({
    meta: [{ title: "Perfil" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm text-muted-foreground">Nome</dt>
            <dd className="text-sm font-medium">{user.name || "—"}</dd>

            <dt className="text-sm text-muted-foreground">E-mail</dt>
            <dd className="text-sm font-medium">{user.email}</dd>

            <dt className="text-sm text-muted-foreground">Autenticação em dois fatores</dt>
            <dd>
              <Badge variant={user.mfa_enabled ? "green" : "gray"}>{user.mfa_enabled ? "Ativada" : "Desativada"}</Badge>
            </dd>
          </dl>
        </CardContent>
      </Card>
      <SocialAccountsCard />
    </div>
  );
}
