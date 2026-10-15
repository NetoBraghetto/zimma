import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DateTimeFormatter } from "@/lib/datetime-formatter";
import { OAUTH_PROVIDER_LABEL, type OAuthProvider, oauthService } from "@/services/oauth-service";
import { GoogleIcon, InstagramIcon } from "./provider-icons";

const PROVIDERS: { provider: OAuthProvider; icon: ReactNode }[] = [
  { provider: "google", icon: <GoogleIcon /> },
  { provider: "instagram", icon: <InstagramIcon /> },
];

export function SocialAccountsCard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => oauthService.accounts(),
  });
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  async function connect(provider: OAuthProvider) {
    setBusy(provider);
    await oauthService.start(provider, "link");
    // On success the browser leaves the page; this only runs when starting failed.
    setBusy(null);
  }

  async function disconnect(provider: OAuthProvider) {
    setBusy(provider);
    try {
      await oauthService.unlink(provider);
      toast.success(`${OAUTH_PROVIDER_LABEL[provider]} desconectado`);
      await refetch();
    } catch (_err) {
      toast.error("Não foi possível desconectar a conta", { description: "Tente novamente." });
    }
    setBusy(null);
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Contas conectadas</CardTitle>
        <CardDescription>
          Conecte uma conta para acessar o sistema sem senha. O Instagram aceita apenas contas profissionais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <ul className="grid divide-y divide-border">
            {PROVIDERS.map(({ provider, icon }) => {
              const account = data?.data.find((item) => item.provider === provider);
              const available = data?.meta.providers?.[provider] ?? false;
              const label = OAUTH_PROVIDER_LABEL[provider];

              return (
                <li key={provider} className="flex items-center gap-3 py-3">
                  <span className="flex size-8 items-center justify-center rounded-full border bg-muted">{icon}</span>
                  <div className="grid min-w-0 flex-1">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {account
                        ? `${account.username || "Conectado"} · desde ${DateTimeFormatter(account.created_at, false)}`
                        : available
                          ? "Não conectado"
                          : "Indisponível no momento"}
                    </span>
                  </div>
                  {account ? (
                    <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => disconnect(provider)}>
                      {busy === provider ? <Spinner /> : null} Desconectar
                    </Button>
                  ) : (
                    <Button size="sm" disabled={busy !== null || !available} onClick={() => connect(provider)}>
                      {busy === provider ? <Spinner /> : null} Conectar
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
