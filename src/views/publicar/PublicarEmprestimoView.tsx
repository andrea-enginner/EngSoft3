"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const MAX_FOTOS = 4;
const MAX_TAMANHO_FOTO = 5 * 1024 * 1024;
const FORMATOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

type FotoSelecionada = {
  arquivo: File;
  id: string;
  url: string;
};

type ErrosFormulario = Partial<
  Record<"fotos" | "titulo" | "categoria" | "condicao" | "descricao", string>
>;

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

export function PublicarEmprestimoView() {
  const [fotos, setFotos] = useState<FotoSelecionada[]>([]);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [condicao, setCondicao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [status, setStatus] = useState("");
  const fotosRef = useRef<FotoSelecionada[]>([]);
  const inputFotosRef = useRef<HTMLInputElement>(null);
  const tituloRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);
  const primeiraCondicaoRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  useEffect(() => {
    return () => fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.url));
  }, []);

  function limparErro(campo: keyof ErrosFormulario) {
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setStatus("");
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
      fotos: fotos.length === 0 ? "Adicione pelo menos uma foto." : undefined,
      titulo: titulo.trim() ? undefined : "Informe o título do item.",
      categoria: categoria ? undefined : "Selecione uma categoria.",
      condicao: condicao ? undefined : "Selecione a condição do item.",
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
        descricao: descricaoRef.current,
      };
      focos[primeiroErro]?.focus();
      setStatus("Revise os campos indicados antes de continuar.");
      return;
    }

    const emprestimo = {
      tipo: "emprestimo" as const,
      titulo: titulo.trim(),
      categoria,
      condicao,
      descricao: descricao.trim(),
      fotos: fotos.map((foto) => foto.arquivo),
    };

    void emprestimo;
    setStatus("Empréstimo pronto. A publicação depende da integração com autenticação, Supabase e Storage.");
  }

  const campoBase = "w-full rounded-xl border bg-surface px-4 py-3 text-base text-foreground outline-none placeholder:text-muted/80 focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

  return (
    <main className="min-h-full bg-background px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-3xl rounded-2xl bg-surface px-5 py-8 shadow-[0_12px_35px_rgba(76,29,149,0.06)] sm:px-8 lg:px-10">
        <h1 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">O que você quer emprestar?</h1>

        <form className="mt-9 space-y-10" noValidate onSubmit={enviar}>
          <fieldset aria-describedby={erros.fotos ? "erro-fotos" : "ajuda-fotos"}>
            <legend className="text-2xl font-semibold text-foreground">Fotos do item</legend>
            <p id="ajuda-fotos" className="mt-2 text-sm text-muted">Adicione de uma a quatro fotos claras e bem iluminadas.</p>
            <div className="mt-5 flex flex-wrap gap-4">
              {fotos.length < MAX_FOTOS && (
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-300 bg-transparent text-center text-sm font-medium text-muted transition hover:border-primary-500 hover:text-primary-700 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
                  <input ref={inputFotosRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selecionarFotos} aria-invalid={Boolean(erros.fotos)} aria-describedby={erros.fotos ? "ajuda-fotos erro-fotos" : "ajuda-fotos"} />
                  <IconeCamera />
                  <span className="mt-2">Adicionar foto</span>
                </label>
              )}
              {fotos.map((foto, indice) => (
                <div key={foto.id} className="group relative h-32 w-32 overflow-hidden rounded-xl border border-border bg-soft">
                  <Image src={foto.url} alt={`Prévia da foto ${indice + 1}`} fill unoptimized className="object-cover" />
                  <button type="button" onClick={() => removerFoto(foto.id)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/80 text-lg text-white shadow-sm hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-white" aria-label={`Remover foto ${indice + 1}`}>×</button>
                </div>
              ))}
            </div>
            {erros.fotos && <p id="erro-fotos" className="mt-2 text-sm font-medium text-red-700">{erros.fotos}</p>}
          </fieldset>

          <fieldset className="space-y-7">
            <legend className="mb-6 text-2xl font-semibold text-foreground">Detalhes</legend>
            <div>
              <label htmlFor="titulo" className="mb-2 block text-sm font-semibold">O que é?</label>
              <input ref={tituloRef} id="titulo" name="titulo" value={titulo} maxLength={100} onChange={(event) => { setTitulo(event.target.value); limparErro("titulo"); }} aria-invalid={Boolean(erros.titulo)} aria-describedby={erros.titulo ? "erro-titulo" : "ajuda-titulo"} className={`${campoBase} ${erros.titulo ? "border-red-600" : "border-primary-300"}`} placeholder="Ex.: Furadeira de impacto ou barraca de camping" />
              <p id="ajuda-titulo" className="mt-2 text-xs text-muted">Seja descritivo, isso ajuda na busca.</p>
              {erros.titulo && <p id="erro-titulo" className="mt-2 text-sm font-medium text-red-700">{erros.titulo}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="categoria" className="mb-2 block text-sm font-semibold">Categoria</label>
                <select ref={categoriaRef} id="categoria" name="categoria" value={categoria} onChange={(event) => { setCategoria(event.target.value); limparErro("categoria"); }} aria-invalid={Boolean(erros.categoria)} aria-describedby={erros.categoria ? "erro-categoria" : undefined} className={`${campoBase} ${erros.categoria ? "border-red-600" : "border-primary-300"}`}>
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

              <fieldset aria-invalid={Boolean(erros.condicao)} aria-describedby={erros.condicao ? "erro-condicao" : undefined}>
                <legend className="mb-2 text-sm font-semibold">Condição</legend>
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
            <button type="submit" className="w-full rounded-xl bg-primary-700 px-5 py-4 font-semibold text-white shadow-sm hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">Publicar empréstimo</button>
            <p className="mt-4 text-center text-xs text-muted">Ao publicar, você concorda com nossos <span className="font-medium">Termos de Uso</span>.</p>
            <p className={`mt-4 text-center text-sm font-medium ${status.startsWith("Empréstimo pronto") ? "text-primary-700" : "text-red-700"}`} role="status" aria-live="polite">{status}</p>
          </div>
        </form>
      </section>
    </main>
  );
}
