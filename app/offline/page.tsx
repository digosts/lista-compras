import type { Metadata } from "next";
import Link from "next/link";
import { CartIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="bg-surface border-line text-muted mb-4 grid size-16 place-items-center rounded-3xl border">
        <CartIcon className="size-7" />
      </div>
      <h1 className="text-lg font-semibold">Você está sem conexão</h1>
      <p className="text-muted mt-1.5 max-w-xs text-sm leading-relaxed">
        As telas já visitadas continuam disponíveis. Para salvar preços e finalizar a compra é
        preciso reconectar.
      </p>
      <Link
        href="/"
        className="bg-brand mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
      >
        Tentar novamente
      </Link>
    </main>
  );
}
