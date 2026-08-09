import Link from "next/link";
import type { Metadata } from "next";
import { getFinishedLists, summarizeFinished, type ListDTO } from "@/lib/lists";
import { brl, formatDayAndHour, formatMonth } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { DbErrorState, EmptyState } from "@/components/States";
import { ChevronRightIcon, ReceiptIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Finalizadas" };

function groupByMonth(lists: ListDTO[]) {
  const groups = new Map<string, ListDTO[]>();
  for (const list of lists) {
    const key = formatMonth(list.finishedAt);
    const bucket = groups.get(key);
    if (bucket) bucket.push(list);
    else groups.set(key, [list]);
  }
  return [...groups.entries()];
}

export default async function FinalizadasPage() {
  let lists: ListDTO[] | null = null;
  let dbError: string | null = null;

  try {
    lists = await getFinishedLists();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Erro ao acessar o banco de dados.";
  }

  const stats = lists ? summarizeFinished(lists) : null;

  return (
    <>
      <PageHeader
        title="Finalizadas"
        subtitle={
          stats && stats.count > 0
            ? `${stats.count} compra${stats.count > 1 ? "s" : ""} registrada${stats.count > 1 ? "s" : ""}`
            : undefined
        }
      />

      <main className="flex-1 px-4 pb-32">
        {dbError ? (
          <DbErrorState message={dbError} />
        ) : lists && lists.length > 0 && stats ? (
          <div className="space-y-5">
            <section className="border-line bg-surface grid grid-cols-2 gap-3 rounded-[var(--radius-card)] border p-4">
              <div>
                <p className="text-muted text-[12px] font-semibold tracking-wide uppercase">
                  Total gasto
                </p>
                <p className="mt-0.5 text-[26px] leading-none font-extrabold tabular-nums">
                  {brl(stats.total)}
                </p>
              </div>
              <div className="border-line border-l pl-3">
                <p className="text-muted text-[12px] font-semibold tracking-wide uppercase">
                  Média
                </p>
                <p className="text-muted mt-0.5 text-[26px] leading-none font-extrabold tabular-nums">
                  {brl(stats.average)}
                </p>
              </div>
            </section>

            {groupByMonth(lists).map(([month, monthLists]) => (
              <section key={month}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-muted text-[12px] font-semibold tracking-wide uppercase">
                    {month}
                  </h2>
                  <span className="text-muted text-[12px] font-semibold tabular-nums">
                    {brl(monthLists.reduce((acc, list) => acc + list.total, 0))}
                  </span>
                </div>
                <ul className="border-line bg-surface divide-line divide-y overflow-hidden rounded-[var(--radius-card)] border">
                  {monthLists.map((list) => (
                    <li key={list.id}>
                      <Link
                        href={`/finalizadas/${list.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[var(--surface-2)]"
                      >
                        <span className="bg-brand-soft text-brand-ink grid size-10 shrink-0 place-items-center rounded-xl">
                          <ReceiptIcon className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold">
                            {list.name}
                          </span>
                          <span className="text-muted block text-[12.5px]">
                            {formatDayAndHour(list.finishedAt)} · {list.purchasedCount}{" "}
                            {list.purchasedCount === 1 ? "item" : "itens"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[15px] font-bold tabular-nums">
                          {brl(list.total)}
                        </span>
                        <ChevronRightIcon className="text-muted size-4 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ReceiptIcon className="size-7" />}
            title="Nenhuma compra finalizada"
            description="Quando você finalizar uma compra, ela aparece aqui com data, hora e o total gasto."
            actionLabel="Ver listas em aberto"
            actionHref="/"
          />
        )}
      </main>
    </>
  );
}
