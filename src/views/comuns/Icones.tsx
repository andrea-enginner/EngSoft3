/**
 * Camada VIEW — ícones.
 *
 * SVG inline para não depender de biblioteca externa. Todos herdam a cor do
 * texto (`currentColor`), então a cor se controla pelo `className` do pai.
 */

type PropsIcone = {
  className?: string;
};

const BASE = {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconeCasa({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function IconeTrocas({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M3 8h14l-3-3" />
      <path d="M21 16H7l3 3" />
    </svg>
  );
}

export function IconePublicar({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function IconeMensagem({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8Z" />
    </svg>
  );
}

export function IconePerfil({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function IconeSino({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.5 19a2 2 0 0 0 3 0" />
    </svg>
  );
}

export function IconeCoracao({
  className,
  preenchido = false,
}: PropsIcone & { preenchido?: boolean }) {
  return (
    <svg {...BASE} className={className} fill={preenchido ? "currentColor" : "none"}>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />
    </svg>
  );
}

export function IconeDoacao({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M20 12v9H4v-9" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 21V7" />
      <path d="M12 7S10.5 3 8 3a2.5 2.5 0 0 0 0 5h4Z" />
      <path d="M12 7s1.5-4 4-4a2.5 2.5 0 0 1 0 5h-4Z" />
    </svg>
  );
}

export function IconeEmprestimo({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}

export function IconeLocal({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconeEstrela({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className} fill="currentColor" strokeWidth={0}>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
    </svg>
  );
}

export function IconeCondicao({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function IconeFiltro({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function IconeSeta({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconeImagem({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className} strokeWidth={1.5}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-2 4 4" />
    </svg>
  );
}

export function IconeCiclo({ className }: PropsIcone) {
  return (
    <svg {...BASE} className={className}>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
      <path d="M20 4v4h-4M4 20v-4h4" />
    </svg>
  );
}
