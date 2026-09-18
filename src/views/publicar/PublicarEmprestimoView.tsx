"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { publicarEmprestimoAction } from "@/controllers/publicar-emprestimo.actions";
import type { EmprestimoEdicao, UnidadeDuracao } from "@/models/entities/item";

const MAX_FOTOS = 4;
const MAX_TAMANHO_FOTO = 5 * 1024 * 1024;
const MAX_VALOR_CENTAVOS = 2_147_483_647;
const FORMATOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const SUGESTOES_UNIDADE: Record<string, UnidadeDuracao> = {
  ferramentas: "dias",
  livros: "semanas",
  eletronicos: "dias",
  esporte: "dias",
  casa: "dias",
  outros: "dias",
};
const UNIDADES_SINGULAR: Record<UnidadeDuracao, string> = {
  minutos: "minuto",
  horas: "hora",
  dias: "dia",
  semanas: "semana",
};
const FORMATADOR_BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type FotoSelecionada = {
  arquivo: File;
  id: string;
  url: string;
};

type ErrosFormulario = Partial<Record<"fotos" | "titulo" | "categoria" | "condicao" | "duracaoQuantidade" | "duracaoUnidade" | "valorUnitario" | "descricao", string>>;

function converterValorEmCentavos(valor: string): number | null {
  if (valor.length > 11) return null;
  const partes = /^(\d+)(?:\.(\d{1,2}))?$/.exec(valor);
  if (!partes) return null;
  const centavos = BigInt(partes[1]) * BigInt(100) + BigInt((partes[2] ?? "").padEnd(2, "0") || "0");
  return centavos >= BigInt(1) && centavos <= BigInt(MAX_VALOR_CENTAVOS) ? Number(centavos) : null;
}

function IconeCamera() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-2h6.4l1.1 2h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
      <circle cx="12" cy="12.5" r="3.2" />
      <path strokeLinecap="round" d="M19 3v4M17 5h4" />
    </svg>
  );
}

function IconeBrilho() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.5 3.1 2 4.6 5 5-3 .5-4.5 2-5 5-.5-3-2-4.5-5-5 3-.4 4.5-1.9 5-5ZM18.5 14c.3 2 1.3 3 3.5 3.5-2.2.3-3.2 1.3-3.5 3.5-.4-2.2-1.4-3.2-3.5-3.5 2.1-.4 3.1-1.4 3.5-3.5ZM5 15c.2 1.2.8 1.8 2 2-1.2.2-1.8.8-2 2-.2-1.2-.8-1.8-2-2 1.2-.2 1.8-.8 2-2Z" />
    </svg>
  );
}

function IconeUso() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5M4 4v4.5h4.5" />
      <path strokeLinecap="round" d="M12 8v4l2.5 1.5" />
    </svg>
  );
}

export function PublicarEmprestimoView({ anuncio }: { anuncio?: EmprestimoEdicao }) {
  const router = useRouter();
  const [resultado, executarPublicacao, enviando] = useActionState(publicarEmprestimoAction, { erro: "" });
  const [fotos, setFotos] = useState<FotoSelecionada[]>([]);
  const [titulo, setTitulo] = useState(anuncio?.titulo ?? "");
  const [categoria, setCategoria] = useState(anuncio?.categoria ?? "");
  const [condicao, setCondicao] = useState(anuncio?.condicao ?? "");
  const [valorUnitario, setValorUnitario] = useState(anuncio ? (anuncio.valorUnitarioCentavos / 100).toFixed(2) : "");
  const [duracaoQuantidade, setDuracaoQuantidade] = useState(anuncio ? String(anuncio.duracaoQuantidade) : "");
  const unidadeInicial = anuncio && ["dias", "semanas"].includes(anuncio.duracaoUnidade) ? anuncio.duracaoUnidade : "";
  const [duracaoUnidade, setDuracaoUnidade] = useState<UnidadeDuracao | "">(unidadeInicial);
  const [unidadeAlteradaManualmente, setUnidadeAlteradaManualmente] = useState(false);
  const [descricao, setDescricao] = useState(anuncio?.descricao ?? "");
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [status, setStatus] = useState("");
  const fotosRef = useRef<FotoSelecionada[]>([]);
  const inputFotosRef = useRef<HTMLInputElement>(null);
  const tituloRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);
  const primeiraCondicaoRef = useRef<HTMLInputElement>(null);
  const valorUnitarioRef = useRef<HTMLInputElement>(null);
  const duracaoQuantidadeRef = useRef<HTMLInputElement>(null);
  const duracaoUnidadeRef = useRef<HTMLSelectElement>(null);
  const descricaoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  useEffect(() => {
    return () => fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.url));
  }, []);

  useEffect(() => {
    if (!resultado.itemId) return;
    fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.url));
    router.push(`/itens/${resultado.itemId}`);
  }, [resultado.itemId, router]);

  function limparErro(campo: keyof ErrosFormulario) {
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setStatus("");
  }

  function selecionarCategoria(novaCategoria: string) {
    setCategoria(novaCategoria);
    limparErro("categoria");
    const sugestao = SUGESTOES_UNIDADE[novaCategoria];
    if (sugestao && !unidadeAlteradaManualmente) {
      setDuracaoUnidade(sugestao);
      limparErro("duracaoUnidade");
    }
    if (sugestao && !duracaoQuantidade) {
      setDuracaoQuantidade("1");
      limparErro("duracaoQuantidade");
    }
  }

  function selecionarFotos(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files ?? []);
    const vagas = MAX_FOTOS - fotos.length;
    const validas: File[] = [];
    let erro = "";

    for (const arquivo of arquivos) {
      if (!FORMATOS_ACEITOS.includes(arquivo.type)) {
        erro = "Use somente imagens JPEG, PNG ou WebP.";
      } else if (arquivo.size > MAX_TAMANHO_FOTO) {
        erro = "Cada foto deve ter no máximo 5 MiB.";
      } else if (validas.length >= vagas) {
        erro = "Você pode adicionar no máximo quatro fotos.";
      } else {
        validas.push(arquivo);
      }
    }

    if (validas.length > 0) {
      setFotos((atuais) => [
        ...atuais,
        ...validas.map((arquivo) => ({
          arquivo,
          id: crypto.randomUUID(),
          url: URL.createObjectURL(arquivo),
        })),
      ]);
    }
    setErros((atuais) => ({ ...atuais, fotos: erro || undefined }));
    setStatus("");
    event.target.value = "";
  }

  function removerFoto(id: string) {
    setFotos((atuais) => {
      const removida = atuais.find((foto) => foto.id === id);
      if (removida) URL.revokeObjectURL(removida.url);
      return atuais.filter((foto) => foto.id !== id);
    });
    setStatus("");
  }

  function validar(): ErrosFormulario {
    return {
      fotos: fotos.length === 0 && !anuncio ? "Adicione pelo menos uma foto." : undefined,
      titulo: titulo.trim() ? undefined : "Informe o título do item.",
      categoria: categoria ? undefined : "Selecione uma categoria.",
      condicao: condicao ? undefined : "Selecione a condição do item.",
      duracaoQuantidade: Number.isInteger(Number(duracaoQuantidade)) && Number(duracaoQuantidade) >= 1 && Number(duracaoQuantidade) <= 9999 ? undefined : "Informe uma quantidade entre 1 e 9999.",
      duracaoUnidade: duracaoUnidade ? undefined : "Selecione uma unidade de duração.",
      valorUnitario: converterValorEmCentavos(valorUnitario) === null ? "Informe um valor por unidade entre R$ 0,01 e R$ 21.474.836,47." : undefined,
      descricao: descricao.trim() ? undefined : "Descreva o item e as condições do empréstimo.",
    };
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const proximosErros = validar();
    setErros(proximosErros);

    const primeiroErro = Object.entries(proximosErros).find(([, mensagem]) => mensagem)?.[0] as keyof ErrosFormulario | undefined;
    if (primeiroErro) {
      const focos = {
        fotos: inputFotosRef.current,
        titulo: tituloRef.current,
        categoria: categoriaRef.current,
        condicao: primeiraCondicaoRef.current,
        duracaoQuantidade: duracaoQuantidadeRef.current,
        duracaoUnidade: duracaoUnidadeRef.current,
        valorUnitario: valorUnitarioRef.current,
        descricao: descricaoRef.current,
      };
      focos[primeiroErro]?.focus();
      setStatus("Revise os campos indicados antes de continuar.");
      return;
    }

    const dados = new FormData();
    if (anuncio) dados.set("anuncioId", anuncio.id);
    dados.set("titulo", titulo.trim());
    dados.set("categoria", categoria);
    dados.set("condicao", condicao);
    dados.set("descricao", descricao.trim());
    const valorUnitarioCentavos = converterValorEmCentavos(valorUnitario);
    if (valorUnitarioCentavos === null) return;
    dados.set("valorUnitarioCentavos", String(valorUnitarioCentavos));
    dados.set("duracaoQuantidade", duracaoQuantidade);
    dados.set("duracaoUnidade", duracaoUnidade);
    fotos.forEach((foto) => dados.append("fotos", foto.arquivo));
    setStatus("");
    startTransition(() => executarPublicacao(dados));
  }

  const campoBase = "w-full rounded-xl border bg-surface px-4 py-3 text-base text-foreground outline-none placeholder:text-muted/80 focus:border-primary-500 focus:ring-2 focus:ring-primary-100";
  const sugestaoUnidade = SUGESTOES_UNIDADE[categoria];
  const quantidadeNumerica = Number(duracaoQuantidade);
  const valorUnitarioCentavos = converterValorEmCentavos(valorUnitario);
  const resumoDisponivel = duracaoUnidade && Number.isInteger(quantidadeNumerica) && quantidadeNumerica >= 1 && quantidadeNumerica <= 9999 && valorUnitarioCentavos !== null;

  return (
    <main className="min-h-full bg-background px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-3xl rounded-2xl border border-primary-100 bg-surface px-5 py-8 shadow-[0_16px_45px_rgba(76,29,149,0.08)] sm:px-8 lg:px-10">
        <h1 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{anuncio ? "Editar empréstimo" : "O que você quer emprestar?"}</h1>

        <form className="mt-9 space-y-10" noValidate onSubmit={enviar}>
          <fieldset aria-describedby={erros.fotos ? "erro-fotos" : "ajuda-fotos"}>
            <legend className="w-full text-center text-2xl font-semibold text-foreground">Fotos do item</legend>
            <p id="ajuda-fotos" className="mt-2 text-center text-sm text-muted">{anuncio ? "As fotos atuais serão mantidas nesta edição." : "Adicione de uma a quatro fotos claras e bem iluminadas."}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-4">
              {!anuncio && fotos.length < MAX_FOTOS && (
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-300 bg-transparent text-center text-sm font-medium text-muted transition hover:border-primary-500 hover:text-primary-700 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
                  <input ref={inputFotosRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selecionarFotos} aria-invalid={Boolean(erros.fotos)} aria-describedby={erros.fotos ? "ajuda-fotos erro-fotos" : "ajuda-fotos"} />
                  <IconeCamera />
                  <span className="mt-2">Adicionar foto</span>
                </label>
              )}
              {anuncio?.imagens.map((imagem, indice) => (
                <div key={imagem} className="relative h-32 w-32 overflow-hidden rounded-xl border border-border bg-soft">
                  <Image src={imagem} alt={`Foto atual ${indice + 1}`} fill unoptimized={imagem.startsWith("http")} className="object-cover" />
                </div>
              ))}
              {fotos.map((foto, indice) => (
                <div key={foto.id} className="group relative h-32 w-32 overflow-hidden rounded-xl border border-border bg-soft">
                  <Image src={foto.url} alt={`Prévia da foto ${indice + 1}`} fill unoptimized className="object-cover" />
                  <button type="button" onClick={() => removerFoto(foto.id)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/80 text-lg text-white shadow-sm hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-white" aria-label={`Remover foto ${indice + 1}`}>×</button>
                </div>
              ))}
            </div>
            {erros.fotos && <p id="erro-fotos" className="mt-2 text-center text-sm font-medium text-red-700">{erros.fotos}</p>}
          </fieldset>

          <fieldset className="space-y-7">
            <legend className="mb-6 w-full text-center text-2xl font-semibold text-foreground">Detalhes</legend>
            <div>
              <label htmlFor="titulo" className="mb-2 block text-sm font-semibold">O que é?</label>
              <input ref={tituloRef} id="titulo" name="titulo" value={titulo} maxLength={100} onChange={(event) => { setTitulo(event.target.value); limparErro("titulo"); }} aria-invalid={Boolean(erros.titulo)} aria-describedby={erros.titulo ? "erro-titulo" : "ajuda-titulo"} className={`${campoBase} ${erros.titulo ? "border-red-600" : "border-primary-300"}`} placeholder="Ex.: Furadeira de impacto ou barraca de camping" />
              <p id="ajuda-titulo" className="mt-2 text-xs text-muted">Seja descritivo, isso ajuda na busca.</p>
              {erros.titulo && <p id="erro-titulo" className="mt-2 text-sm font-medium text-red-700">{erros.titulo}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="categoria" className="mb-2 block text-sm font-semibold">Categoria</label>
                <select ref={categoriaRef} id="categoria" name="categoria" value={categoria} onChange={(event) => selecionarCategoria(event.target.value)} aria-invalid={Boolean(erros.categoria)} aria-describedby={erros.categoria ? "erro-categoria" : undefined} className={`${campoBase} ${erros.categoria ? "border-red-600" : "border-primary-300"}`}>
                  <option value="">Selecione uma categoria...</option>
                  <option value="ferramentas">Ferramentas</option>
                  <option value="livros">Livros</option>
                  <option value="eletronicos">Eletrônicos</option>
                  <option value="esporte">Esporte</option>
                  <option value="casa">Casa</option>
                  <option value="outros">Outros</option>
                </select>
                {erros.categoria && <p id="erro-categoria" className="mt-2 text-sm font-medium text-red-700">{erros.categoria}</p>}
              </div>

              <fieldset className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 sm:col-span-2" aria-describedby="ajuda-duracao">
                <legend className="mx-auto px-2 text-center text-sm font-semibold">Limite de duração</legend>
                <p id="ajuda-duracao" className="mb-4 mt-1 text-center text-xs text-muted">Defina o período máximo que cada reserva poderá ter.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="duracao-quantidade" className="mb-2 block text-sm font-medium">Quantidade máxima</label>
                    <input ref={duracaoQuantidadeRef} id="duracao-quantidade" name="duracaoQuantidade" type="number" inputMode="numeric" min="1" max="9999" step="1" value={duracaoQuantidade} onChange={(event) => { setDuracaoQuantidade(event.target.value); limparErro("duracaoQuantidade"); }} aria-invalid={Boolean(erros.duracaoQuantidade)} aria-describedby={erros.duracaoQuantidade ? "erro-duracao-quantidade ajuda-duracao" : "ajuda-duracao"} className={`${campoBase} ${erros.duracaoQuantidade ? "border-red-600" : "border-primary-300"}`} placeholder="Ex.: 2" />
                    {erros.duracaoQuantidade && <p id="erro-duracao-quantidade" className="mt-2 text-sm font-medium text-red-700">{erros.duracaoQuantidade}</p>}
                  </div>
                  <div>
                    <label htmlFor="duracao-unidade" className="mb-2 block text-sm font-medium">Unidade</label>
                    <select ref={duracaoUnidadeRef} id="duracao-unidade" name="duracaoUnidade" value={duracaoUnidade} onChange={(event) => { setDuracaoUnidade(event.target.value as UnidadeDuracao | ""); setUnidadeAlteradaManualmente(Boolean(event.target.value)); limparErro("duracaoUnidade"); }} aria-invalid={Boolean(erros.duracaoUnidade)} aria-describedby={erros.duracaoUnidade ? "erro-duracao-unidade ajuda-duracao" : "ajuda-duracao"} className={`${campoBase} ${erros.duracaoUnidade ? "border-red-600" : "border-primary-300"}`}>
                      <option value="">Selecione...</option>
                      <option value="dias">Dias</option>
                      <option value="semanas">Semanas</option>
                    </select>
                    {erros.duracaoUnidade && <p id="erro-duracao-unidade" className="mt-2 text-sm font-medium text-red-700">{erros.duracaoUnidade}</p>}
                  </div>
                </div>
                {sugestaoUnidade && duracaoUnidade !== sugestaoUnidade ? (
                  <button type="button" className="mx-auto mt-3 block text-sm font-medium text-primary-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500" onClick={() => { setDuracaoUnidade(sugestaoUnidade); setUnidadeAlteradaManualmente(false); if (!duracaoQuantidade) setDuracaoQuantidade("1"); limparErro("duracaoUnidade"); }}>
                    Aplicar sugestão: {UNIDADES_SINGULAR[sugestaoUnidade]}
                  </button>
                ) : null}
              </fieldset>

              <div className="mx-auto w-full max-w-sm sm:col-span-2">
                <label htmlFor="valor-unitario" className="mb-2 block text-sm font-semibold">Valor por {duracaoUnidade ? UNIDADES_SINGULAR[duracaoUnidade] : "unidade"}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">R$</span>
                  <input ref={valorUnitarioRef} id="valor-unitario" name="valorUnitario" type="number" inputMode="decimal" min="0.01" max="21474836.47" step="0.01" value={valorUnitario} disabled={!duracaoUnidade} onChange={(event) => { setValorUnitario(event.target.value); limparErro("valorUnitario"); }} aria-invalid={Boolean(erros.valorUnitario)} aria-describedby={erros.valorUnitario ? "erro-valor-unitario" : "ajuda-valor-unitario"} className={`${campoBase} pl-12 disabled:cursor-not-allowed disabled:bg-soft disabled:opacity-70 ${erros.valorUnitario ? "border-red-600" : "border-primary-300"}`} placeholder={duracaoUnidade ? "0,00" : "Selecione a unidade primeiro"} />
                </div>
                <p id="ajuda-valor-unitario" className="mt-2 text-xs text-muted">Informe o preço de uma unidade do período escolhido.</p>
                {erros.valorUnitario && <p id="erro-valor-unitario" className="mt-2 text-sm font-medium text-red-700">{erros.valorUnitario}</p>}
              </div>

              {resumoDisponivel && duracaoUnidade && valorUnitarioCentavos !== null ? (
                <aside className="rounded-2xl border border-primary-200 bg-primary-50 p-4 text-center sm:col-span-2" aria-live="polite">
                  <p className="text-sm text-muted">
                    {quantidadeNumerica} {quantidadeNumerica === 1 ? UNIDADES_SINGULAR[duracaoUnidade] : duracaoUnidade} × {FORMATADOR_BRL.format(valorUnitarioCentavos / 100)} por {UNIDADES_SINGULAR[duracaoUnidade]}
                  </p>
                  <p className="mt-1 text-lg font-bold text-primary-700">Total no período máximo: {FORMATADOR_BRL.format((quantidadeNumerica * valorUnitarioCentavos) / 100)}</p>
                </aside>
              ) : null}

              <fieldset className="sm:col-span-2" aria-invalid={Boolean(erros.condicao)} aria-describedby={erros.condicao ? "erro-condicao" : undefined}>
                <legend className="mb-2 w-full text-center text-sm font-semibold">Condição</legend>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-center text-sm transition focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 ${condicao === "novo_quase_novo" ? "border-primary-700 bg-primary-50 text-primary-700 ring-1 ring-primary-700" : "border-primary-300 bg-surface text-muted hover:border-primary-500"}`}>
                    <input ref={primeiraCondicaoRef} className="sr-only" type="radio" name="condicao" value="novo_quase_novo" checked={condicao === "novo_quase_novo"} onChange={(event) => { setCondicao(event.target.value); limparErro("condicao"); }} />
                    <IconeBrilho /><span>Novo/Quase Novo</span>
                  </label>
                  <label className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-center text-sm transition focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 ${condicao === "marcas_de_uso" ? "border-primary-700 bg-primary-50 text-primary-700 ring-1 ring-primary-700" : "border-primary-300 bg-surface text-muted hover:border-primary-500"}`}>
                    <input className="sr-only" type="radio" name="condicao" value="marcas_de_uso" checked={condicao === "marcas_de_uso"} onChange={(event) => { setCondicao(event.target.value); limparErro("condicao"); }} />
                    <IconeUso /><span>Com marcas de uso</span>
                  </label>
                </div>
                {erros.condicao && <p id="erro-condicao" className="mt-2 text-sm font-medium text-red-700">{erros.condicao}</p>}
              </fieldset>
            </div>

            <div>
              <label htmlFor="descricao" className="mb-2 block text-sm font-semibold">Descrição</label>
              <textarea ref={descricaoRef} id="descricao" name="descricao" value={descricao} maxLength={500} rows={5} onChange={(event) => { setDescricao(event.target.value); limparErro("descricao"); }} aria-invalid={Boolean(erros.descricao)} aria-describedby={erros.descricao ? "erro-descricao contador-descricao" : "contador-descricao"} className={`${campoBase} resize-y ${erros.descricao ? "border-red-600" : "border-primary-300"}`} placeholder="Conte um pouco sobre o estado do item, por quanto tempo costuma emprestar e os cuidados necessários." />
              <p id="contador-descricao" className="mt-1 text-right text-xs text-muted">{descricao.length}/500</p>
              {erros.descricao && <p id="erro-descricao" className="mt-2 text-sm font-medium text-red-700">{erros.descricao}</p>}
            </div>
          </fieldset>

          <div className="border-t border-border pt-6">
            <button type="submit" disabled={enviando} className="w-full rounded-xl bg-primary-700 px-5 py-4 font-semibold text-white shadow-sm hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{enviando ? (anuncio ? "Salvando…" : "Publicando…") : (anuncio ? "Salvar alterações" : "Publicar empréstimo")}</button>
            {!anuncio ? <p className="mt-4 text-center text-xs text-muted">Ao publicar, você concorda com nossos <span className="font-medium">Termos de Uso</span>.</p> : null}
            <p className="mt-4 text-center text-sm font-medium text-red-700" role="status" aria-live="polite">{status || resultado.erro}</p>
            {resultado.erro.startsWith("Entre na sua conta") ? <p className="mt-2 text-center text-sm"><Link href="/login?retorno=/publicar" className="font-semibold text-primary-700 underline">Ir para o login</Link></p> : null}
          </div>
        </form>
      </section>
    </main>
  );
}
