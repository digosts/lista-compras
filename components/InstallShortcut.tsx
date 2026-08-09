"use client";

import Link from "next/link";
import { DownloadIcon } from "@/components/icons";
import { usePwaInstall } from "@/components/usePwaInstall";

/** Atalho discreto no cabeçalho — some assim que o app já está instalado. */
export function InstallShortcut() {
  const { installed, ready } = usePwaInstall();
  if (!ready || installed) return null;

  return (
    <Link
      href="/instalar"
      aria-label="Instalar aplicativo"
      className="border-line bg-surface text-muted grid size-10 shrink-0 place-items-center rounded-full border transition-transform active:scale-90"
    >
      <DownloadIcon className="size-5" />
    </Link>
  );
}
