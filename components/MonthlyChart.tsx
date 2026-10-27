"use client";

import { useState } from "react";
import type { MonthTotal } from "@/lib/reports";
import { brl, formatMonthKey, formatPercent } from "@/lib/format";

const MAX_MONTHS = 12;

/** Gasto mais alto é ruim: subida em vermelho, queda em verde — sempre com seta e sinal. */
function ChangeBadge({ change }: { change: number | null }) {
  if (change == null) return <span className="text-muted">sem comparação</span>;
  if (change === 0) return <span className="text-muted">= estável</span>;
  return (
    <span className={change > 0 ? "text-danger" : "text-brand-ink"}>
      {change > 0 ? "▲" : "▼"} {formatPercent(change)}
    </span>
  );
}

export function MonthlyChart({ months }: { months: MonthTotal[] }) {
  const visible = months.slice(-MAX_MONTHS);
  const [selected, setSelected] = useState(visible.length - 1);
  const max = Math.max(...visible.map((month) => month.total), 1);
  const current = visible[selected];

  return (
    <div>
      {/* Detalhe do mês selecionado: substitui o tooltip, que não existe no toque. */}
      <div className="flex items-end justify-between gap-3" aria-live="polite">
        <div className="min-w-0">
          <p className="text-muted text-[12.5px] capitalize">
            {formatMonthKey(current.key)} · {current.count}{" "}
            {current.count === 1 ? "compra" : "compras"}
          </p>
          <p className="text-[24px] leading-tight font-extrabold tabular-nums">
            {brl(current.total)}
          </p>
        </div>
        <p className="shrink-0 pb-1 text-right text-[13px] font-semibold tabular-nums">
          <ChangeBadge change={current.change} />
          {current.change != null ? (
            <span className="text-muted block text-[11px] font-normal">vs. mês anterior</span>
          ) : null}
        </p>
      </div>

      <div
        role="list"
        aria-label="Total gasto por mês"
        className="border-line mt-4 flex h-40 items-end gap-1 border-b"
      >
        {visible.map((month, index) => {
          const active = index === selected;
          return (
            <button
              key={month.key}
              type="button"
              role="listitem"
              aria-label={`${formatMonthKey(month.key)}: ${brl(month.total)}`}
              aria-pressed={active}
              onClick={() => setSelected(index)}
              onMouseEnter={() => setSelected(index)}
              className="flex h-full min-w-0 flex-1 items-end justify-center"
            >
              <span
                className={`block w-full max-w-7 rounded-t-[4px] transition-colors ${
                  active ? "bg-brand" : "bg-brand/35"
                }`}
                style={{ height: `${Math.max((month.total / max) * 100, 2)}%` }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-1">
        {visible.map((month, index) => (
          <div key={month.key} className="min-w-0 flex-1 text-center">
            <p
              className={`truncate text-[10.5px] capitalize ${
                index === selected ? "text-ink font-semibold" : "text-muted"
              }`}
            >
              {formatMonthKey(month.key).replace(/\.? \d+$/, "")}
            </p>
            <p className="truncate text-[9.5px] font-semibold tabular-nums">
              {month.change == null || Math.round(month.change) === 0 ? (
                <span className="text-muted">—</span>
              ) : (
                <span className={month.change > 0 ? "text-danger" : "text-brand-ink"}>
                  {formatPercent(Math.round(month.change))}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
