import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getList } from "@/lib/lists";
import {
  brl,
  formatDuration,
  formatHour,
  formatQuantity,
  formatWeekday,
} from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { FinishedActions } from "@/components/FinishedActions";
import { ClockIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const list = await getList(id);
    return { title: list?.name ?? "Resumo da compra" };
  } catch {
    return { title: "Resumo da compra" };
  }
}

export default async function ResumoCompraPage({ params }: Props) {
  const { id } = await params;
  const list = await getList(id);

  if (!list) notFound();
  if (list.status !== "done") redirect(`/listas/${list.id}`);

  const bought = list.items.filter((item) => item.purchased);
  const skipped = list.items.filter((item) => !item.purchased);
  const duration = formatDuration(list.startedAt, list.finishedAt);
  const unitCount = bought.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <PageHeader
        title={list.name}
        subtitle="Resumo da compra"
        backHref="/finalizadas"
        action={<FinishedActions listId={list.id} />}
      />

      <main className="flex-1 space-y-4 px-4 pb-32">
        <section className="border-brand/30 bg-brand-soft rounded-[var(--radius-card)] border p-5">
          <p className="text-brand-ink/80 text-[12px] font-semibold tracking-wide uppercase">
            Total gasto
          </p>
          <p className="text-brand-ink mt-1 text-[40px] leading-none font-extrabold tabular-nums">
            {brl(list.total)}
          </p>
          {/* first-letter, não capitalize: "9 de agosto" não pode virar "9 De Agosto". */}
          <p className="text-brand-ink/80 mt-2.5 text-[13px] font-medium first-letter:uppercase">
            {formatWeekday(list.finishedAt)}
          </p>
        </section>

        <section className="border-line bg-surface grid grid-cols-3 divide-x divide-[var(--line)] rounded-[var(--radius-card)] border py-4">
          <div className="px-3 text-center">
            <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">Início</p>
            <p className="mt-1 text-[17px] font-bold tabular-nums">{formatHour(list.startedAt)}</p>
          </div>
          <div className="px-3 text-center">
            <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">Fim</p>
            <p className="mt-1 text-[17px] font-bold tabular-nums">{formatHour(list.finishedAt)}</p>
          </div>
          <div className="px-3 text-center">
            <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">Duração</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[17px] font-bold tabular-nums">
              {duration ? (
                <>
                  <ClockIcon className="text-muted size-4" />
                  {duration}
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-muted text-[12px] font-semibold tracking-wide uppercase">
              Itens comprados · {bought.length}
            </h2>
            <span className="text-muted text-[12px] font-medium">
              {formatQuantity(unitCount)} unidades
            </span>
          </div>
          <ul className="border-line bg-surface divide-line divide-y overflow-hidden rounded-[var(--radius-card)] border">
            {bought.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{item.name}</p>
                  <p className="text-muted text-[12.5px] tabular-nums">
                    {formatQuantity(item.quantity)} {item.unit} × {brl(item.price ?? 0)}
                  </p>
                </div>
                <span className="shrink-0 text-[15px] font-bold tabular-nums">
                  {brl(item.subtotal)}
                </span>
              </li>
            ))}
            <li className="bg-surface-2 flex items-center justify-between px-4 py-3.5">
              <span className="text-[14px] font-semibold">Total</span>
              <span className="text-brand text-[19px] font-extrabold tabular-nums">
                {brl(list.total)}
              </span>
            </li>
          </ul>
        </section>

        {skipped.length > 0 ? (
          <section>
            <h2 className="text-muted mb-2 px-1 text-[12px] font-semibold tracking-wide uppercase">
              Não comprados · {skipped.length}
            </h2>
            <ul className="border-line bg-surface divide-line divide-y overflow-hidden rounded-[var(--radius-card)] border">
              {skipped.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-muted min-w-0 flex-1 truncate text-[15px] line-through">
                    {item.name}
                  </span>
                  <span className="text-muted shrink-0 text-[12.5px] tabular-nums">
                    {formatQuantity(item.quantity)} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
