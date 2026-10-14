import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TbArrowRight, TbLock, TbMail } from "react-icons/tb";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormErrors } from "@/components/form/form-errors";
import { FormGroupPassword } from "@/components/form/form-group-password";
import { FormGroupText } from "@/components/form/form-group-text";
import { Submit } from "@/components/form/submit";
import { AuthCard } from "@/components/layout/auth-card";
import { buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authService } from "@/services/auth-service";

export const Route = createFileRoute("/autenticacao/reset-senha")({
  validateSearch: (search) => ({
    token: (search.token as string) || "",
  }),
  beforeLoad: async ({ search }) => {
    if (!search.token) {
      throw redirect({ to: "/autenticacao/login", search: { redirect: "/" } });
    }
  },
  component: RouteComponent,
});

type FormValues = {
  email: string;
  password: string;
  password_confirmation: string;
};

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { token } = Route.useSearch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.passwordReset({ ...values, token });
      toast.success("Senha redefinida com sucesso", {
        description: "Você pode agora fazer login com sua nova senha.",
      });
      navigate({ to: "/autenticacao/login", search: { redirect: "/" } });
    } catch (err) {
      FormErrors(err, setError);
    }
    setIsLoading(false);
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex min-h-dvh items-center justify-center p-6">
      <AuthCard
        description="Crie uma nova senha para sua conta"
        footer={
          <Link to="/autenticacao/login" search={{ redirect: "/" }} className={buttonVariants({ variant: "link", size: "sm" })}>
            Voltar para o login
          </Link>
        }
      >
        <FieldGroup className="gap-4">
          <FormGroupText
            label="Email"
            name="email"
            type="email"
            control={control}
            error={errors.email}
            placeholder="email@example.com"
            autoComplete="username"
            autoFocus
            addons={[
              <div key="mail-addon" className="px-2">
                <TbMail />
              </div>,
            ]}
          />
          <FormGroupPassword
            label="Nova senha"
            name="password"
            control={control}
            error={errors.password}
            autoComplete="new-password"
            addons={[
              <div key="lock-addon" className="px-2">
                <TbLock />
              </div>,
            ]}
          />
          <FormGroupPassword
            label="Confirme a nova senha"
            name="password_confirmation"
            control={control}
            error={errors.password_confirmation}
            autoComplete="new-password"
            addons={[
              <div key="lock-confirmation-addon" className="px-2">
                <TbLock />
              </div>,
            ]}
          />

          <Submit isLoading={isLoading} className="w-full">
            Redefinir senha <TbArrowRight />
          </Submit>
        </FieldGroup>
      </AuthCard>
    </Form>
  );
}
