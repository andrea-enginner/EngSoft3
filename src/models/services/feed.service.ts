import { listarItensAtivos } from "@/models/repositories/item.repository";
export async function carregarItensDoFeed() { return listarItensAtivos(); }
