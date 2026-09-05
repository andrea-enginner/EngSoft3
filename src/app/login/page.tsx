import type { Metadata } from "next";
import { LoginView } from "@/views/login/LoginView";

export const metadata: Metadata = {
  title: "Login",
  description: "Entre na sua conta do Ciclo.",
};

export default function LoginPage() {
  return <LoginView />;
}