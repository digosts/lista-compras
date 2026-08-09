"use client";

import { useCallback, useEffect, useState } from "react";
import { IosInstallSteps } from "@/components/IosInstallSteps";
import { AlertIcon, CheckIcon, CloseIcon, DownloadIcon } from "@/components/icons";
import { usePwaInstall } from "@/components/usePwaInstall";

type CheckState = "pending" | "ok" | "fail" | "warn";
type Check = { key: string; label: string; state: CheckState; detail: string };

const REQUIRED_ICONS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  checks.push({
    key: "secure",
    label: "Conexão segura",
    state: window.isSecureContext ? "ok" : "fail",
    detail: window.isSecureContext
      ? `Servido em ${location.protocol}//${location.host}`
      : "PWAs só instalam em HTTPS (ou localhost).",
  });

  // Manifest
  try {
    const res = await fetch("/manifest.webmanifest", { cache: "no-store" });
    const manifest = (await res.json()) as Record<string, unknown>;
    const missing = ["name", "short_name", "start_url", "icons", "display"].filter(
      (field) => !manifest[field],
    );
    checks.push({
      key: "manifest",
      label: "Manifest do app",
      state: res.ok && missing.length === 0 ? "ok" : "fail",
      detail:
        missing.length === 0
          ? `${String(manifest.name)} · display: ${String(manifest.display)}`
          : `Campos ausentes: ${missing.join(", ")}`,
    });
  } catch {
    checks.push({
      key: "manifest",
      label: "Manifest do app",
      state: "fail",
      detail: "Não foi possível carregar /manifest.webmanifest",
    });
  }

  // Service worker
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const active = registration?.active ?? registration?.waiting ?? registration?.installing;
      checks.push({
        key: "sw",
        label: "Service worker (modo offline)",
        state: active ? "ok" : "warn",
        detail: active
          ? `Estado: ${active.state} · escopo ${registration?.scope ?? "/"}`
          : "Ainda registrando. Recarregue a página em alguns segundos.",
      });
    } catch {
      checks.push({
        key: "sw",
        label: "Service worker (modo offline)",
        state: "fail",
        detail: "Falha ao registrar o service worker.",
      });
    }
  } else {
    checks.push({
      key: "sw",
      label: "Service worker (modo offline)",
      state: "fail",
      detail: "Este navegador não suporta service workers.",
    });
  }

  // Ícones
  const iconResults = await Promise.all(
    REQUIRED_ICONS.map(async (src) => {
      try {
        const res = await fetch(src, { method: "HEAD", cache: "no-store" });
        return res.ok;
      } catch {
        return false;
      }
    }),
  );
  const okIcons = iconResults.filter(Boolean).length;
  checks.push({
    key: "icons",
    label: "Ícones Android e iOS",
    state: okIcons === REQUIRED_ICONS.length ? "ok" : "fail",
    detail: `${okIcons} de ${REQUIRED_ICONS.length} ícones disponíveis (192, 512, maskable e apple-touch).`,
  });

  return checks;
}

const STATE_STYLES: Record<CheckState, string> = {
  ok: "bg-brand-soft text-brand-ink",
  fail: "bg-danger-soft text-danger",
  warn: "bg-warn-soft text-warn",
  pending: "bg-surface-2 text-muted",
};

function CheckRow({ check }: { check: Check }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={`grid size-7 shrink-0 place-items-center rounded-full ${STATE_STYLES[check.state]}`}>
        {check.state === "ok" ? (
          <CheckIcon className="size-4 stroke-[2.6]" />
        ) : check.state === "fail" ? (
          <CloseIcon className="size-3.5 stroke-[2.6]" />
        ) : check.state === "warn" ? (
          <AlertIcon className="size-4" />
        ) : (
          <span className="bg-muted size-2 animate-pulse rounded-full" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{check.label}</p>
        <p className="text-muted mt-0.5 text-[12.5px] leading-snug break-words">{check.detail}</p>
      </div>
    </li>
  );
}

export function InstallPanel() {
  const { installed, canPrompt, platform, ready, promptInstall } = usePwaInstall();
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [promptResult, setPromptResult] = useState<string | null>(null);

  const verify = useCallback(async () => {
    setChecking(true);
    try {
      setChecks(await runChecks());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  const allOk = checks?.every((check) => check.state === "ok") ?? false;

  return (
    <div className="space-y-4">
      <section
        className={`rounded-[var(--radius-card)] border p-5 ${
          installed ? "border-brand/40 bg-brand-soft" : "border-line bg-surface"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
              installed ? "bg-brand text-white" : "bg-surface-2 text-muted"
            }`}
          >
            {installed ? <CheckIcon className="size-6 stroke-[2.4]" /> : <DownloadIcon className="size-6" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-base leading-tight font-semibold">
              {installed ? "App instalado" : "Ainda não instalado"}
            </h2>
            <p className="text-muted mt-0.5 text-[13px] leading-snug">
              {installed
                ? "Você está usando a versão instalada, em tela cheia."
                : "Instale para abrir direto pelo ícone, sem a barra do navegador."}
            </p>
          </div>
        </div>

        {!installed && ready ? (
          <div className="mt-4">
            {canPrompt ? (
              <button
                type="button"
                onClick={async () => {
                  const outcome = await promptInstall();
                  setPromptResult(
                    outcome === "accepted"
                      ? "Instalação confirmada! Procure o ícone na tela de início."
                      : outcome === "dismissed"
                        ? "Instalação cancelada. Você pode tentar de novo quando quiser."
                        : "Seu navegador não ofereceu a instalação automática.",
                  );
                  void verify();
                }}
                className="bg-brand w-full rounded-xl py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Instalar agora
              </button>
            ) : platform === "ios" ? null : (
              <p className="text-muted bg-surface-2 rounded-xl p-3 text-[12.5px] leading-snug">
                O navegador ainda não liberou o botão automático. No Chrome/Edge do Android abra o
                menu <strong>⋮</strong> e toque em <strong>Instalar aplicativo</strong>.
              </p>
            )}
            {promptResult ? (
              <p className="text-brand-ink mt-2 text-[12.5px] font-medium">{promptResult}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {!installed && platform === "ios" ? (
        <section className="border-line bg-surface rounded-[var(--radius-card)] border p-5">
          <h2 className="text-base font-semibold">No iPhone e iPad</h2>
          <p className="text-muted mt-0.5 mb-3.5 text-[13px]">
            Abra este endereço no <strong>Safari</strong> e siga os passos.
          </p>
          <IosInstallSteps />
        </section>
      ) : null}

      <section className="border-line bg-surface rounded-[var(--radius-card)] border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Verificação da instalação</h2>
            <p className="text-muted mt-0.5 text-[13px]">
              {checks === null
                ? "Checando requisitos…"
                : allOk
                  ? "Tudo pronto para instalar."
                  : "Alguns requisitos precisam de atenção."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void verify()}
            disabled={checking}
            className="border-line text-muted shrink-0 rounded-xl border px-3 py-2 text-[13px] font-medium disabled:opacity-50"
          >
            {checking ? "…" : "Rever"}
          </button>
        </div>

        <ul className="divide-line mt-2 divide-y">
          {(checks ?? [
            { key: "s", label: "Conexão segura", state: "pending", detail: "…" },
            { key: "m", label: "Manifest do app", state: "pending", detail: "…" },
            { key: "w", label: "Service worker (modo offline)", state: "pending", detail: "…" },
            { key: "i", label: "Ícones Android e iOS", state: "pending", detail: "…" },
          ]).map((check) => (
            <CheckRow key={check.key} check={check as Check} />
          ))}
        </ul>
      </section>

      {!installed && platform !== "ios" ? (
        <section className="border-line bg-surface rounded-[var(--radius-card)] border p-5">
          <h2 className="text-base font-semibold">No Android</h2>
          <ol className="text-muted mt-2 list-decimal space-y-1.5 pl-4 text-[13px] leading-relaxed">
            <li>Abra o app no Chrome, Edge ou Samsung Internet.</li>
            <li>
              Toque em <strong>Instalar</strong> acima — ou no menu <strong>⋮</strong> →{" "}
              <strong>Instalar aplicativo</strong>.
            </li>
            <li>Confirme e o ícone aparece na tela de início junto com os outros apps.</li>
          </ol>
        </section>
      ) : null}
    </div>
  );
}
