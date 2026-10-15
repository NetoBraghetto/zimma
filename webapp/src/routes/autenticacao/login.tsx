import { createFileRoute, Link } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TbArrowRight, TbLock, TbMail } from "react-icons/tb";
import { toast } from "sonner";
import MonogramPath from "@/assets/images/monogram.svg?url";
import { Form } from "@/components/form/form";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormGroupPassword } from "@/components/form/form-group-password";
import { FormGroupText } from "@/components/form/form-group-text";
import { FormText } from "@/components/form/form-text";
import { Submit } from "@/components/form/submit";
import { GoogleIcon, InstagramIcon } from "@/components/resources/oauth/provider-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { authService } from "@/services/auth-service";
import Config from "@/services/config-service";
import { DeviceService } from "@/services/device-service";
import { type OAuthProvider, oauthService } from "@/services/oauth-service";

export const Route = createFileRoute("/autenticacao/login")({
  validateSearch: (search) => ({
    redirect: (search.redirect as string) || "/",
  }),
  component: RouteComponent,
});

type FormValues = {
  email: string;
  password: string;
  code: string;
  trust_device: boolean;
};

function RouteComponent() {
  const { redirect } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
      code: "",
      trust_device: false,
    },
  });

  async function onSubmit(values: FormValues) {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await authService.authenticate(values);
      if (data.mfa_required) {
        if (data.mfa_token) {
          setMfaToken(data.mfa_token);
        } else {
          toast.error("Não foi possível iniciar a verificação em duas etapas", { description: "Tente novamente." });
        }
      } else {
        navigate({ to: redirect });
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Credenciais inválidas", {
          description: "Verifique se seus dados estão corretos.",
        });
      }
    }
    setIsLoading(false);
  }

  async function onOAuth(provider: OAuthProvider) {
    if (oauthLoading) {
      return;
    }
    setOauthLoading(provider);
    await oauthService.start(provider);
    // On success the browser leaves the page; this only runs when starting failed.
    setOauthLoading(null);
  }

  async function onMfaSubmit(values: FormValues) {
    if (isLoading || !mfaToken) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.mfaVerify({
        mfa_token: mfaToken,
        code: values.code,
        device_id: DeviceService.getDeviceId(),
        trust_device: values.trust_device,
      });
      navigate({ to: redirect });
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Código inválido", {
          description: "Verifique o código gerado pelo aplicativo autenticador.",
        });
      }
    }
    setIsLoading(false);
  }

  if (mfaToken) {
    return (
      <Form onSubmit={handleSubmit(onMfaSubmit)} className="mx-auto grid w-87.5 gap-6">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Verificação em duas etapas</h1>
          <p className="text-sm text-muted-foreground">Informe o código gerado pelo seu aplicativo autenticador.</p>
        </div>
        <div className="grid gap-4">
          <FormText
            label="Código"
            name="code"
            control={control}
            error={errors.code}
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
          />
          <FormCheckbox label="Confiar neste dispositivo por 60 dias" name="trust_device" control={control} error={errors.trust_device} />
          <div className="grid gap-2">
            <Submit isLoading={isLoading} className="w-full">
              Verificar
            </Submit>
            <Button type="button" variant="ghost" onClick={() => setMfaToken(null)}>
              Voltar
            </Button>
          </div>
        </div>
      </Form>
    );
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-8 shadow-sm">
        <div className="w-fit p-3 border rounded-full bg-muted mx-auto">
          {/* <TbLock className="size-8 text-primary" /> */}
          <img src={MonogramPath} alt={Config.get("APP_NAME")} className="size-8 mx-auto" />
        </div>

        <div className="grid gap-2 text-center mt-4">
          <span className="text-2xl font-extrabold text-primary">{Config.get("APP_NAME")}</span>
          <p className="text-sm text-muted-foreground">Acesse sua conta</p>
        </div>

        <FieldGroup className="mt-6 gap-4">
          <FormGroupText
            label="Email"
            name="email"
            control={control}
            error={errors.email}
            placeholder="email@example.com"
            autoComplete="username"
            addons={[
              <div key="mail-addon" className="px-2">
                <TbMail />
              </div>,
            ]}
          />
          <FormGroupPassword
            label="Senha"
            name="password"
            control={control}
            error={errors.password}
            autoComplete="current-password"
            addons={[
              <div key="lock-addon" className="px-2">
                <TbLock />
              </div>,
            ]}
          />

          <Submit isLoading={isLoading} className="w-full">
            Acesse <TbArrowRight />
          </Submit>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Esqueceu a senha?</div>
            <Link to="/autenticacao/esqueci-minha-senha" className={buttonVariants({ variant: "link", size: "sm" })}>
              Recuperar senha
            </Link>
          </div>

          <FieldSeparator>Ou</FieldSeparator>

          <Button
            type="button"
            variant="outline"
            className="w-full normal-case"
            disabled={oauthLoading !== null}
            onClick={() => onOAuth("google")}
          >
            {oauthLoading === "google" ? <Spinner /> : <GoogleIcon />} Acesse com Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full normal-case"
            disabled={oauthLoading !== null}
            onClick={() => onOAuth("instagram")}
          >
            {oauthLoading === "instagram" ? <Spinner /> : <InstagramIcon />} Acesse com Instagram
          </Button>
        </FieldGroup>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não possui conta?{" "}
          <Link to="/autenticacao/cadastre-se" className={buttonVariants({ variant: "link", size: "sm" })}>
            Crie uma conta
          </Link>
        </p>
      </div>
    </Form>
  );
}
