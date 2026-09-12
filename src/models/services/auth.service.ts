import {
  cadastrarUsuario,
  loginUsuario,
  logoutUsuario,
} from "@/models/repositories/auth.repository";

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
  confirmarSenha: string;
};

export async function cadastrar(dados: DadosCadastro) {
  if (!dados.email || !dados.senha) {
    throw new Error("E-mail e senha são obrigatórios.");
  }

  if (dados.senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  if (dados.senha !== dados.confirmarSenha) {
    throw new Error("As senhas não coincidem.");
  }

  const { data, error } = await cadastrarUsuario(dados);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function login(email: string, senha: string) {
  if (!email || !senha) {
    throw new Error("E-mail e senha são obrigatórios.");
  }

  const { data, error } = await loginUsuario(email, senha);

  if (error) {
    throw new Error("E-mail ou senha inválidos.");
  }

  return data;
}

export async function logout() {
  const { error } = await logoutUsuario();

  if (error) {
    throw new Error("Não foi possível sair da conta.");
  }
}
