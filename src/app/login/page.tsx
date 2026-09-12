import type { Metadata } from "next";
import { LoginView } from "@/views/login/LoginView";

export const metadata: Metadata = {
  title: "Login",
  description: "Entre na sua conta do Ciclo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const parametros = await searchParams;
  const proximaRota = typeof parametros.next === "string" ? parametros.next : "/feed";
  return <LoginView proximaRota={proximaRota} />;
}
