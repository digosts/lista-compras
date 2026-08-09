"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { CurrencyInput } from "@/components/CurrencyInput";
import { brl, formatQuantity, round2 } from "@/lib/format";
import type { ItemDTO } from "@/lib/lists";

export function PriceSheet({
  item,
  onClose,
  onConfirm,
  onClear,
  onRemove,
  saving,
}: {
  item: ItemDTO | null;
  onClose: () => void;
  onConfirm: (price: number) => void;
  onClear: () => void;
  onRemove: () => void;
  saving: boolean;
}) {
  const [cents, setCents] = useState(0);

  useEffect(() => {
    if (item) setCents(item.price != null ? Math.round(item.price * 100) : 0);
  }, [item]);

  if (!item) return null;

  const price = round2(cents / 100);
  const subtotal = round2(price * item.quantity);

  return (
    <Sheet
      open
      onClose={onClose}
      title={item.name}
      description={`Quantidade na lista: ${formatQuantity(item.quantity)} ${item.unit}`}
    >
      <p className="text-muted mb-2 text-[12px] font-semibold tracking-wide uppercase">
        Valor unitário
      </p>
      <CurrencyInput cents={cents} onCents={setCents} autoFocus onEnter={() => onConfirm(price)} />

      <div className="bg-brand-soft mt-3 flex items-center justify-between rounded-2xl px-4 py-3">
        <span className="text-brand-ink text-[13px] font-medium">
          {formatQuantity(item.quantity)} {item.unit} × {brl(price)}
        </span>
        <span className="text-brand-ink text-xl font-bold tabular-nums">{brl(subtotal)}</span>
      </div>

      <button
        type="button"
        disabled={saving || cents <= 0}
        onClick={() => onConfirm(price)}
        className="bg-brand mt-4 w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
      >
        {saving ? "Salvando…" : "Colocar no carrinho"}
      </button>

      <button
        type="button"
        disabled={saving}
        onClick={item.price != null ? onClear : onRemove}
        className="text-danger mt-2 w-full rounded-2xl py-3 text-[14px] font-semibold disabled:opacity-40"
      >
        {item.price != null ? "Tirar do carrinho" : "Remover da lista"}
      </button>
    </Sheet>
  );
}
