import type { Metadata } from "next";
import { ImpulsionarView } from "@/views/emprestimos/ImpulsionarView";
export const metadata: Metadata = { title: "Impulsionar empréstimo" };
export default function ImpulsionarPage() { return <ImpulsionarView />; }
