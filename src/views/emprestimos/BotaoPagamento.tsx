"use client";

import { useState } from "react";

export function BotaoPagamento({ solicitacaoId }: { solicitacaoId: string }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function abrirCheckout() {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/pagamentos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitacaoId }),
      });
      const dados = await resposta.json() as { url?: string; erro?: string };
      if (!resposta.ok || !dados.url) {
        throw new Error(dados.erro ?? "Não foi possível abrir o checkout.");
      }
      window.location.assign(dados.url);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível abrir o checkout.");
      setCarregando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={abrirCheckout}
        disabled={carregando}
        className="flex w-full items-center justify-center rounded-xl bg-primary-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-900/15 outline-none hover:-translate-y-0.5 hover:bg-primary-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
      >
        {carregando ? "Preparando ambiente seguro..." : "Ir para o pagamento de teste"}
      </button>
      {erro ? <p role="alert" className="mt-3 text-sm font-medium text-red-600">{erro}</p> : null}
    </div>
  );
}
