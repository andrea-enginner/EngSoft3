import { carregarItensDoFeed } from "@/models/services/feed.service";
export async function carregarFeed(categoria?: string) {
  return carregarItensDoFeed(categoria);
}
