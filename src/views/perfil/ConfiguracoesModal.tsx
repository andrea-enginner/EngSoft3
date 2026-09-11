"use client";

/**
 * Camada VIEW — botão "Configurações" e a modal de edição da localização.
 *
 * O envio vai para a Server Action `salvarLocalizacaoAction`; a validação
 * real acontece no servidor, dentro do service. Aqui só há estado de tela.
 */

import { useEffect, useId, useState, useTransition } from "react";
import type { Usuario } from "@/models/entities/usuario";
import { salvarLocalizacaoAction } from "@/controllers/perfil.actions";
import { IconeEngrenagem } from "@/views/comuns/Icones";

const CAMPO =
  "h-[45px] w-full rounded-[11px] border border-border bg-white px-3.5 text-[14px] text-foreground outline-none placeholder:text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-300";

export function ConfiguracoesModal({ usuario }: { usuario: Usuario }) {
  const [aberto, setAberto] = useState(false);
  const [cidade, setCidade] = useState(usuario.cidade);
  const [estado, setEstado] = useState(usuario.estado);
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
    setCidade(usuario.cidade);
    setEstado(usuario.estado);
    setErro("");
    setAberto(true);
  }

  function enviar(formulario: FormData) {
    iniciarEnvio(async () => {
      const resultado = await salvarLocalizacaoAction(formulario);
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
        className="flex items-center justify-center gap-2 rounded-xl bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100"
      >
        <IconeEngrenagem className="h-4 w-4" />
        Configurações
      </button>

      {aberto ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/40 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar configurações"
            onClick={() => setAberto(false)}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titulo}
            className="relative max-h-full w-full max-w-[420px] overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-left shadow-xl"
          >
            <h2 id={titulo} className="text-lg font-bold text-primary-900">
              Configurações
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Atualize a localização exibida no seu perfil.
            </p>

            <form action={enviar} className="mt-5 flex flex-col gap-4">
              <div>
                <label htmlFor="cidade" className="text-[13px] font-medium text-foreground">
                  Cidade
                </label>
                <input
                  id="cidade"
                  name="cidade"
                  value={cidade}
                  onChange={(evento) => setCidade(evento.target.value)}
                  required
                  minLength={2}
                  className={`${CAMPO} mt-1.5`}
                />
              </div>

              <div>
                <label htmlFor="estado" className="text-[13px] font-medium text-foreground">
                  Estado (sigla)
                </label>
                <input
                  id="estado"
                  name="estado"
                  value={estado}
                  onChange={(evento) => setEstado(evento.target.value.toUpperCase())}
                  required
                  minLength={2}
                  maxLength={2}
                  placeholder="PE"
                  className={`${CAMPO} mt-1.5 uppercase`}
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
