"use client";

/**
 * Camada VIEW — botão "Editar Perfil" e a modal de edição dos dados básicos.
 *
 * O envio vai para a Server Action `salvarDadosBasicosAction`; a validação
 * real acontece no servidor, dentro do service. Aqui só há estado de tela.
 */

import { useEffect, useId, useState, useTransition } from "react";
import type { Usuario } from "@/models/entities/usuario";
import { salvarDadosBasicosAction } from "@/controllers/perfil.actions";
import { Avatar } from "@/views/perfil/Avatar";

const CAMPO =
  "h-[45px] w-full rounded-[11px] border border-border bg-white px-3.5 text-[14px] text-foreground outline-none placeholder:text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-300";

export function EditarPerfilModal({ usuario }: { usuario: Usuario }) {
  const [aberto, setAberto] = useState(false);
  // Campos controlados: o React reseta formulários não controlados ao fim de
  // uma Server Action, o que apagaria o que foi digitado quando a validação
  // do servidor recusa o envio.
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [avatar, setAvatar] = useState(usuario.avatar ?? "");
  const [erro, setErro] = useState("");
  const [enviando, iniciarEnvio] = useTransition();
  const titulo = useId();

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  function abrir() {
    setNome(usuario.nome);
    setEmail(usuario.email);
    setAvatar(usuario.avatar ?? "");
    setErro("");
    setAberto(true);
  }

  function enviar(formulario: FormData) {
    iniciarEnvio(async () => {
      const resultado = await salvarDadosBasicosAction(formulario);
      if (resultado.status === "sucesso") {
        setErro("");
        setAberto(false);
        return;
      }
      setErro(resultado.mensagem);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
      >
        Editar Perfil
      </button>

      {aberto ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/40 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar edição de perfil"
            onClick={() => setAberto(false)}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titulo}
            className="relative max-h-full w-full max-w-[460px] overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-left shadow-xl"
          >
            <h2 id={titulo} className="text-lg font-bold text-primary-900">
              Editar perfil
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Atualize seu nome, e-mail e foto de exibição.
            </p>

            <form action={enviar} className="mt-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  nome={usuario.nome}
                  avatar={avatar || null}
                  className="h-16 w-16 text-lg"
                  sizes="64px"
                />
                <div className="flex-1">
                  <label htmlFor="avatar" className="text-[13px] font-medium text-foreground">
                    Foto (endereço da imagem)
                  </label>
                  <input
                    id="avatar"
                    name="avatar"
                    value={avatar}
                    onChange={(evento) => setAvatar(evento.target.value)}
                    placeholder="https://... ou /itens/minha-foto.jpg"
                    className={`${CAMPO} mt-1.5`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nome" className="text-[13px] font-medium text-foreground">
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  required
                  minLength={3}
                  className={`${CAMPO} mt-1.5`}
                />
              </div>

              <div>
                <label htmlFor="email" className="text-[13px] font-medium text-foreground">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  required
                  className={`${CAMPO} mt-1.5`}
                />
              </div>

              {erro ? (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
                  {erro}
                </p>
              ) : null}

              <div className="mt-1 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="rounded-xl bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {enviando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
