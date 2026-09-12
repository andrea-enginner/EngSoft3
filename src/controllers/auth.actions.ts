"use server";

import { redirect } from "next/navigation";
import {
  cadastrar,
  login,
  logout,
} from "@/models/services/auth.service";

function destinoSeguro(valor: FormDataEntryValue | null) {
  const destino = valor?.toString() ?? "/feed";
  return destino.startsWith("/") && !destino.startsWith("//")
    ? destino
    : "/feed";
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString() ?? "";
  const senha = formData.get("senha")?.toString() ?? "";

  await login(email, senha);

  redirect(destinoSeguro(formData.get("next")));
}

export async function cadastrarAction(formData: FormData) {
  const nome = formData.get("nome")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";
  const cpf = formData.get("cpf")?.toString() ?? "";
  const dataNascimento =
    formData.get("dataNascimento")?.toString() ?? "";
  const telefone = formData.get("telefone")?.toString() ?? "";
  const cep = formData.get("cep")?.toString() ?? "";
  const cidade = formData.get("cidade")?.toString() ?? "";
  const estado = formData.get("estado")?.toString() ?? "";
  const senha = formData.get("senha")?.toString() ?? "";
  const confirmarSenha =
    formData.get("confirmarSenha")?.toString() ?? "";

  await cadastrar({
    nome,
    email,
    cpf,
    dataNascimento,
    telefone,
    cep,
    cidade,
    estado,
    senha,
    confirmarSenha,
  });

  redirect("/feed");
}

export async function logoutAction() {
  await logout();
<<<<<<< HEAD
  redirect("/login");
}
=======

  redirect("/feed");
}
>>>>>>> origin/main
