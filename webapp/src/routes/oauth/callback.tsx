import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/layout/auth-card";
import { Spinner } from "@/components/ui/spinner";
import { OAUTH_PROVIDER_LABEL, type OAuthMode, type OAuthProvider, oauthService } from "@/services/oauth-service";

type CallbackSearch = {
  code: string;
  error: string;
  mode: OAuthMode;
  provider: OAuthProvider;
};

export const Route = createFileRoute("/oauth/callback")({
  validateSearch: (search): CallbackSearch => ({
    code: (search.code as string) || "",
    error: (search.error as string) || "",
    mode: search.mode === "link" ? "link" : "login",
    provider: search.provider === "instagram" ? "instagram" : "google",
  }),
  head: () => ({
    meta: [{ title: "Conectando..." }],
  }),
  component: RouteComponent,
});

function errorMessage(error: string, label: string): string {
  switch (error) {
    case "access_denied":
      return "O acesso foi cancelado.";
    case "invalid_state":
      return "A solicitação expirou. Tente novamente.";
    case "provider_error":
      return `Não foi possível validar sua conta ${label}.`;
    case "not_linked":
      return `Nenhuma conta está conectada a este ${label}. Entre com e-mail ou Google e conecte o ${label} na página de perfil.`;
    case "email_unverified":
      return `O e-mail da sua conta ${label} não está verificado.`;
    case "account_in_use":
      return `Esta conta ${label} já está conectada a outro usuário.`;
    default:
      return "Ocorreu um erro inesperado. Tente novamente.";
  }
}

function RouteComponent() {
  const { code, error, mode, provider } = Route.useSearch();
  const navigate = Route.useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    const label = OAUTH_PROVIDER_LABEL[provider];
    const fail = (message: string) => {
      toast.error(mode === "link" ? `Não foi possível conectar o ${label}` : `Não foi possível acessar com ${label}`, {
        description: message,
        duration: 8000,
      });
      if (mode === "link") {
        navigate({ to: "/perfil", replace: true });
      } else {
        navigate({ to: "/autenticacao/login", search: { redirect: "/" }, replace: true });
      }
    };

    if (error || !code) {
      fail(errorMessage(error, label));
      return;
    }

    oauthService
      .exchange(code)
      .then(({ data }) => {
        if (data.mode === "link") {
          toast.success(`${label} conectado à sua conta`);
          navigate({ to: "/perfil", replace: true });
        } else {
          navigate({ to: "/", replace: true });
        }
      })
      .catch(() => fail(errorMessage("invalid_state", label)));
  }, [code, error, mode, provider, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <AuthCard description="Conectando sua conta...">
        <div className="flex justify-center">
          <Spinner className="size-6" />
        </div>
      </AuthCard>
    </div>
  );
}
