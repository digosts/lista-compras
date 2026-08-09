import Link from "next/link";
import type { ListDTO } from "@/lib/lists";
import { brl, formatDayAndHour } from "@/lib/format";
import { ChevronRightIcon, ClockIcon } from "@/components/icons";

export function StatusPill({ status }: { status: ListDTO["status"] }) {
  if (status === "shopping") {
    return (
      <span className="bg-warn-soft text-warn inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold">
        <span className="bg-warn size-1.5 animate-pulse rounded-full" />
        Em andamento
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="bg-brand-soft text-brand-ink shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">
        Finalizada
      </span>
    );
  }
  return (
    <span className="bg-surface-2 text-muted shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">
      Cadastrada
    </span>
  );
}

export function OpenListCard({ list, index = 0 }: { list: ListDTO; index?: number }) {
  const progress = list.itemsCount ? Math.round((list.purchasedCount / list.itemsCount) * 100) : 0;
  const shopping = list.status === "shopping";

  return (
    <Link
      href={`/listas/${list.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className="animate-pop-in border-line bg-surface block rounded-[var(--radius-card)] border p-4 transition-transform active:scale-[0.985]"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] leading-tight font-semibold">{list.name}</h2>
          <p className="text-muted mt-1 text-[13px]">
            {list.itemsCount} {list.itemsCount === 1 ? "item" : "itens"}
            {shopping ? ` · ${list.purchasedCount} no carrinho` : ""}
          </p>
        </div>
        <StatusPill status={list.status} />
      </div>

      {shopping ? (
        <div className="mt-3.5">
          <div className="bg-surface-2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-brand h-full rounded-full transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-end justify-between gap-2">
            <span className="text-muted inline-flex items-center gap-1.5 text-[12px]">
              <ClockIcon className="size-3.5" />
              Iniciada {formatDayAndHour(list.startedAt)}
            </span>
            <span className="text-brand text-[15px] font-bold">{brl(list.total)}</span>
          </div>
        </div>
      ) : (
        <div className="text-muted mt-3.5 flex items-center justify-between gap-2 text-[12px]">
          <span>Criada {formatDayAndHour(list.createdAt)}</span>
          <span className="text-brand inline-flex items-center gap-1 font-semibold">
            Iniciar compra
            <ChevronRightIcon className="size-3.5 stroke-[2.4]" />
          </span>
        </div>
      )}
    </Link>
  );
}
