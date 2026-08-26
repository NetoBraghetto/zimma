import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormText } from "@/components/form/form-text";
import { Submit } from "@/components/form/submit";
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
      navigate({ to: "/autenticacao/login" });
    } catch (_err) {}
    setIsLoading(false);
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid w-87.5 gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">Esqueci minha senha</h1>
      </div>
      <div className="grid gap-4">
        <FormText
          label="E-mail"
          name="email"
          type="email"
          control={control}
          error={errors.email}
          placeholder="email@example.com"
          autoComplete="username"
        />
        <div className="grid gap-2">
          <Submit isLoading={isLoading} className="w-full">
            Solicitar reset de senha
          </Submit>
        </div>
        <Link to="/autenticacao/login" className="ml-auto inline-block text-sm underline">
          Voltar para login
        </Link>
      </div>
    </Form>
  );
}
