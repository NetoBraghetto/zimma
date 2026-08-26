import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormErrors } from "@/components/form/form-errors";
import { FormPassword } from "@/components/form/form-password";
import { FormText } from "@/components/form/form-text";
import { Submit } from "@/components/form/submit";
import { authService } from "@/services/auth-service";

export const Route = createFileRoute("/autenticacao/reset-senha")({
  validateSearch: (search) => ({
    token: (search.token as string) || "",
  }),
  beforeLoad: async ({ search }) => {
    if (!search.token) {
      throw redirect({ to: "/autenticacao/login" });
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
      navigate({ to: "/autenticacao/login" });
    } catch (err) {
      FormErrors(err, setError);
    }
    setIsLoading(false);
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid w-87.5 gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">Redefinir senha</h1>
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
        <FormPassword label="Senha" name="password" control={control} error={errors.password} autoComplete="new-password" />
        <FormPassword
          label="Confirmação da nova senha"
          name="password_confirmation"
          control={control}
          error={errors.password_confirmation}
          autoComplete="new-password"
        />
        <div className="grid gap-2">
          <Submit isLoading={isLoading} className="w-full">
            Redefinir senha
          </Submit>
        </div>
      </div>
    </Form>
  );
}
