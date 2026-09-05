import { AuthLayout } from "@/views/auth/AuthLayout";
import { LoginForm } from "@/views/login/LoginForm";

export function LoginView() {
  return (
    <AuthLayout titulo="Bem-vindo(a) de volta à nossa vizinhança.">
      <LoginForm />
    </AuthLayout>
  );
}