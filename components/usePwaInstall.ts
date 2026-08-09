"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type Platform = "ios" | "android" | "desktop" | "unknown";

export type PwaInstallState = {
  /** Rodando como app instalado (standalone / tela de início). */
  installed: boolean;
  /** O navegador disparou beforeinstallprompt: dá para instalar com 1 toque. */
  canPrompt: boolean;
  platform: Platform;
  /** iOS não tem prompt automático — só o passo a passo pelo menu Compartilhar. */
  needsManualSteps: boolean;
  ready: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const isIpadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || isIpadOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    iosStandalone === true
  );
}

export function usePwaInstall(): PwaInstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(detectStandalone());
    setReady(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    const display = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => setInstalled(detectStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    display.addEventListener("change", onDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      display.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return {
    installed,
    canPrompt: Boolean(deferred) && !installed,
    platform,
    needsManualSteps: platform === "ios" && !installed,
    ready,
    promptInstall,
  };
}
