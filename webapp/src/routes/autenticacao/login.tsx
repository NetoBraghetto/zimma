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
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { authService } from "@/services/auth-service";
import Config from "@/services/config-service";
import { DeviceService } from "@/services/device-service";

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
              <div key="mail-addon" className="pl-2">
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
              <div key="lock-addon" className="pl-2">
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

          <Button variant="outline" className="w-full normal-case">
            <GoogleIcon /> Acesse com Google
          </Button>

          <Button variant="outline" className="w-full normal-case">
            <InstagramIcon /> Acesse com Instagram
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <title>Google</title>
      <path
        fill="#4285F4"
        d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.645h6.458a5.52 5.52 0 0 1-2.395 3.622v3.01h3.878c2.269-2.09 3.578-5.166 3.578-8.822Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.956-1.075 7.941-2.905l-3.878-3.01c-1.075.72-2.45 1.147-4.063 1.147-3.123 0-5.766-2.11-6.71-4.945H1.284v3.107A11.997 11.997 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.29 14.287a7.2 7.2 0 0 1 0-4.573V6.607H1.284a11.997 11.997 0 0 0 0 10.787l4.006-3.107Z" />
      <path
        fill="#EA4335"
        d="M12 4.77c1.762 0 3.344.606 4.588 1.795l3.442-3.442C17.951 1.19 15.236 0 12 0A11.997 11.997 0 0 0 1.284 6.607l4.006 3.107C6.234 6.88 8.877 4.77 12 4.77Z"
      />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <title>Instagram</title>
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#5851DB" />
        </linearGradient>
      </defs>
      <path
        fill="url(#instagram-gradient)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324Zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"
      />
    </svg>
  );
}
