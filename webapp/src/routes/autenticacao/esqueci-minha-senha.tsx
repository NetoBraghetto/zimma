import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TbArrowRight, TbMail } from "react-icons/tb";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormGroupText } from "@/components/form/form-group-text";
import { Submit } from "@/components/form/submit";
import { AuthCard } from "@/components/layout/auth-card";
import { buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authService } from "@/services/auth-service";

export const Route = createFileRoute("/autenticacao/esqueci-minha-senha")({
  component: RouteComponent,
});

type FormValues = {
  email: string;
};

function RouteComponent() {
  const navigate = Route.useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.passwordRecovery(values);
      toast.success("Solicitação enviada", {
        description: "Verifique seu e-mail para prosseguir.",
      });
      navigate({ to: "/autenticacao/login", search: { redirect: "/" } });
    } catch (_err) {}
    setIsLoading(false);
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex min-h-dvh items-center justify-center p-6">
      <AuthCard
        description="Informe seu e-mail para receber o link de redefinição de senha"
        footer={
          <>
            Lembrou a senha?{" "}
            <Link to="/autenticacao/login" search={{ redirect: "/" }} className={buttonVariants({ variant: "link", size: "sm" })}>
              Voltar para o login
            </Link>
          </>
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

          <Submit isLoading={isLoading} className="w-full">
            Enviar link <TbArrowRight />
          </Submit>
        </FieldGroup>
      </AuthCard>
    </Form>
  );
}
