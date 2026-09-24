import { carregarItensDoFeed } from "@/models/services/feed.service";
export async function carregarFeed(categoria?: string, termo?: string) {
  return carregarItensDoFeed(categoria, termo);
}
