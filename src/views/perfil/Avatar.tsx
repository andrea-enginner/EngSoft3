/**
 * Camada VIEW — avatar do usuário.
 *
 * Sem foto cadastrada, cai nas iniciais do nome sobre o gradiente roxo da
 * identidade do Ciclo. URLs externas passam sem otimização porque o projeto
 * ainda não declara `images.remotePatterns` no `next.config.ts`.
 */

import Image from "next/image";
import { iniciaisDe } from "@/models/entities/usuario";

type PropsAvatar = {
  nome: string;
  avatar: string | null;
  className?: string;
  sizes?: string;
};

export function Avatar({ nome, avatar, className = "", sizes = "112px" }: PropsAvatar) {
  if (!avatar) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-300 to-primary-700 font-bold text-white ${className}`}
      >
        {iniciaisDe(nome)}
      </span>
    );
  }

  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-soft ${className}`}>
      <Image
        src={avatar}
        alt={`Foto de ${nome}`}
        fill
        sizes={sizes}
        className="object-cover"
        unoptimized={avatar.startsWith("http")}
      />
    </span>
  );
}
