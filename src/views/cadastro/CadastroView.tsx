import { AuthLayout } from "@/views/auth/AuthLayout";
import { CadastroForm } from "@/views/cadastro/CadastroForm";

export function CadastroView() {
  return (
    <AuthLayout titulo="Bem-vindo(a) à nossa vizinhança.">
      <CadastroForm />
    </AuthLayout>
  );
}