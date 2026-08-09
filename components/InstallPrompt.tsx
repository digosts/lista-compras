"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet } from "@/components/Sheet";
import { IosInstallSteps } from "@/components/IosInstallSteps";
import { CloseIcon, DownloadIcon } from "@/components/icons";
import { usePwaInstall } from "@/components/usePwaInstall";

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

function wasRecentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const { installed, canPrompt, needsManualSteps, ready, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDismissed(wasRecentlyDismissed());
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage bloqueado (modo privado): só esconde nesta sessão.
    }
  };

  // Não atrapalha durante uma compra em andamento nem na tela dedicada de instalação.
  const hiddenRoute = pathname.startsWith("/listas/") || pathname === "/instalar";
  const visible = ready && !installed && !dismissed && !hiddenRoute && (canPrompt || needsManualSteps);

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-45 px-3 pb-[calc(env(safe-area-inset-bottom)+5.25rem)]">
        <div className="animate-pop-in border-line bg-surface mx-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border p-3 shadow-xl shadow-black/10">
          <div className="bg-brand-soft text-brand-ink grid size-11 shrink-0 place-items-center rounded-xl">
            <DownloadIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-semibold">Instalar na tela de início</p>
            <p className="text-muted text-xs leading-tight">
              Abre em tela cheia e funciona offline no mercado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (canPrompt ? void promptInstall() : setIosSheetOpen(true))}
            className="bg-brand shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Agora não"
            className="text-muted -mr-1 grid size-8 shrink-0 place-items-center rounded-full"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      </div>

      <Sheet
        open={iosSheetOpen}
        onClose={() => setIosSheetOpen(false)}
        title="Instalar no iPhone / iPad"
        description="O iOS instala pelo próprio Safari, em 3 passos."
      >
        <IosInstallSteps />
      </Sheet>
    </>
  );
}
