import { AuthLayout } from "@/views/auth/AuthLayout";
import { LoginForm } from "@/views/login/LoginForm";

export function LoginView({ proximaRota }: { proximaRota?: string }) {
  return (
    <AuthLayout titulo="Bem-vindo(a) de volta à nossa vizinhança.">
      <LoginForm proximaRota={proximaRota} />
    </AuthLayout>
  );
}
