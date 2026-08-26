import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { TbArrowRight, TbLock, TbMail, TbUser } from "react-icons/tb";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormGroupPassword } from "@/components/form/form-group-password";
import { FormGroupText } from "@/components/form/form-group-text";
import { Submit } from "@/components/form/submit";
import { buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authService, type RegisterPayload } from "@/services/auth-service";
import Config from "@/services/config-service";

export const Route = createFileRoute("/autenticacao/cadastre-se")({
  validateSearch: (search) => ({
    redirect: (search.redirect as string) || "/",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<RegisterPayload>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterPayload) {
    if (isSubmitting) {
      return;
    }

    try {
      await authService.register(values);
      toast.success("Cadastro realizado com sucesso", { description: "Você já pode fazer login." });
      navigate({ to: "/autenticacao/login" });
    } catch (err) {
      toast.error("Não foi possível realizar o cadastro", { description: "Tente novamente." });
      // threat
      // if (err instanceof AxiosError) {
      //   toast.error("Credenciais inválidas", {
      //     description: "Verifique se seus dados estão corretos.",
      //   });
      // }
    }
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-8 shadow-sm">
        <div className="w-fit p-3 border rounded-full bg-muted mx-auto">
          <TbUser className="size-8 text-primary" />
        </div>

        <div className="grid gap-2 text-center mt-4">
          <span className="text-2xl font-extrabold text-primary">Cadastre-se</span>
          <p className="text-sm text-muted-foreground">
            Junte-se à {Config.get("APP_NAME")}, sua plataforma de gestão de finanças pessoais.
          </p>
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
            placeholder="********"
            addons={[
              <div key="lock-addon" className="pl-2">
                <TbLock />
              </div>,
            ]}
          />

          <Submit isLoading={isSubmitting} className="w-full">
            Cadastrar <TbArrowRight />
          </Submit>
        </FieldGroup>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Possui uma conta?{" "}
          <Link to="/autenticacao/login" className={buttonVariants({ variant: "link", size: "sm" })}>
            Faça login
          </Link>
        </p>
      </div>
    </Form>
  );
}
