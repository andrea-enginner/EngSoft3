import type { Metadata } from "next";
import { EmprestimosView } from "@/views/emprestimos/EmprestimosView";
export const metadata: Metadata = { title: "Empréstimos" };
export default function EmprestimosPage() { return <EmprestimosView />; }
