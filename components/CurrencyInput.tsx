"use client";

import { useEffect, useRef } from "react";

/**
 * Campo de dinheiro que preenche da direita para a esquerda (digitou 499 → 4,99),
 * o jeito mais rápido de digitar preço com uma mão só dentro do mercado.
 */
export function CurrencyInput({
  cents,
  onCents,
  autoFocus = false,
  onEnter,
}: {
  cents: number;
  onCents: (cents: number) => void;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    // Pequeno atraso para o teclado do iOS abrir junto com a animação do sheet.
    const timer = setTimeout(() => ref.current?.focus(), 180);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const display = (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-surface-2 focus-within:ring-brand/40 flex items-center gap-2 rounded-2xl px-4 py-3.5 ring-2 ring-transparent transition-shadow">
      <span className="text-muted text-lg font-semibold">R$</span>
      <input
        ref={ref}
        value={display}
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        aria-label="Valor unitário"
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 9);
          onCents(digits ? Number.parseInt(digits, 10) : 0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter?.();
          }
        }}
        className="w-full bg-transparent text-right text-3xl font-bold tabular-nums outline-none"
      />
    </div>
  );
}
