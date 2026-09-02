const technologies = ["TypeScript", "Next.js", "React", "Tailwind CSS"];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-xl shadow-primary-900/10 sm:p-12">
        <div
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-100 blur-3xl"
          aria-hidden="true"
        />

        <span className="relative inline-flex rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-primary-300/60">
          Engenharia de Software III
        </span>

        <h1 className="relative mt-6 max-w-2xl text-4xl font-bold tracking-tight text-primary-900 sm:text-6xl">
          Base do projeto pronta para construir em equipe.
        </h1>

        <p className="relative mt-6 max-w-2xl text-lg leading-8 text-muted">
          O ambiente inicial está configurado. Crie sua branch, desenvolva uma
          tarefa por vez e abra um pull request para revisão antes de integrar à
          branch principal.
        </p>

        <ul
          className="relative mt-10 flex flex-wrap gap-3"
          aria-label="Tecnologias"
        >
          {technologies.map((technology) => (
            <li
              key={technology}
              className="rounded-lg border border-border bg-soft px-4 py-2 text-sm font-semibold text-primary-700"
            >
              {technology}
            </li>
          ))}
        </ul>

        <div className="relative mt-10 h-1.5 w-24 rounded-full bg-accent" />
      </section>
    </main>
  );
}
