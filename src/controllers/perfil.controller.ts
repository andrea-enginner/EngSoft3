/**
 * Camada CONTROLLER — leitura.
 *
 * Traduz a entrada crua (os cookies da requisição) em uma sessão do domínio e
 * entrega à página o perfil pronto para desenhar.
 */

import type { Perfil } from "@/models/entities/perfil";
import { sessaoAtual } from "@/lib/supabase/sessao";
import { carregarPerfil } from "@/models/services/perfil.service";

export async function obterPerfil(): Promise<Perfil> {
  return carregarPerfil(await sessaoAtual());
}
