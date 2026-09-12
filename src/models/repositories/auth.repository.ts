import { createClient } from "@/lib/supabase/server";

type DadosCadastro = {
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  cep: string;
  cidade: string;
  estado: string;
  senha: string;
};

export async function cadastrarUsuario(dados: DadosCadastro) {
  const supabase = await createClient();

  return await supabase.auth.signUp({
    email: dados.email,
    password: dados.senha,

    options: {
      data: {
        nome: dados.nome,
        cpf: dados.cpf,
        data_nascimento: dados.dataNascimento,
        telefone: dados.telefone,
        cep: dados.cep,
        cidade: dados.cidade,
        estado: dados.estado,
      },
    },
  });
}

export async function loginUsuario(
  email: string,
  senha: string,
) {
  const supabase = await createClient();

  return await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
}