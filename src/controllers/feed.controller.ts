import { carregarItensDoFeed } from "@/models/services/feed.service";
export async function carregarFeed(
  categoria?: string,
  termo?: string,
  token: string | null = null,
) {
  return carregarItensDoFeed(categoria, termo, token);
}
