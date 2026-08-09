"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addItem as addItemAction,
  clearItemPrice,
  deleteList,
  finishShopping,
  removeItem as removeItemAction,
  setItemPrice,
  startShopping,
} from "@/app/actions";
import type { ItemDTO, ListDTO } from "@/lib/lists";
import { brl, formatDayAndHour, formatQuantity, round2 } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { PriceSheet } from "@/components/PriceSheet";
import { Sheet } from "@/components/Sheet";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";

const UNITS = ["un", "kg", "g", "L", "ml", "cx", "pct", "dz"] as const;

function recalc(list: ListDTO): ListDTO {
  const total = round2(
    list.items.reduce((acc, item) => (item.purchased ? acc + item.subtotal : acc), 0),
  );
  return {
    ...list,
    total,
    itemsCount: list.items.length,
    purchasedCount: list.items.filter((item) => item.purchased).length,
  };
}

export function ShoppingScreen({ initialList }: { initialList: ListDTO }) {
  const router = useRouter();
  const [list, setList] = useState<ListDTO>(initialList);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: 1, unit: "un" as string });
  const [pending, startTransition] = useTransition();

  const activeItem = useMemo(
    () => list.items.find((item) => item.id === activeItemId) ?? null,
    [list.items, activeItemId],
  );

  const pendingItems = list.items.filter((item) => !item.purchased);
  const cartItems = list.items.filter((item) => item.purchased);
  const progress = list.itemsCount ? Math.round((list.purchasedCount / list.itemsCount) * 100) : 0;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Não foi possível salvar.");
    });
  };

  const handleStart = () =>
    run(async () => {
      const result = await startShopping(list.id);
      if (result.ok) {
        setList((current) =>
          recalc({ ...current, status: "shopping", startedAt: new Date().toISOString() }),
        );
      }
      return result;
    });

  const handlePrice = (itemId: string, price: number) =>
    run(async () => {
      const result = await setItemPrice({ listId: list.id, itemId, price });
      if (result.ok) {
        setList((current) =>
          recalc({
            ...current,
            status: current.status === "open" ? "shopping" : current.status,
            startedAt: current.startedAt ?? new Date().toISOString(),
            items: current.items.map((item) =>
              item.id === itemId
                ? { ...item, price, purchased: true, subtotal: round2(price * item.quantity) }
                : item,
            ),
          }),
        );
        setActiveItemId(null);
      }
      return result;
    });

  const handleClear = (itemId: string) =>
    run(async () => {
      const result = await clearItemPrice({ listId: list.id, itemId });
      if (result.ok) {
        setList((current) =>
          recalc({
            ...current,
            items: current.items.map((item) =>
              item.id === itemId ? { ...item, price: null, purchased: false, subtotal: 0 } : item,
            ),
          }),
        );
        setActiveItemId(null);
      }
      return result;
    });

  const handleRemoveItem = (itemId: string) =>
    run(async () => {
      const result = await removeItemAction({ listId: list.id, itemId });
      if (result.ok) {
        setList((current) =>
          recalc({ ...current, items: current.items.filter((item) => item.id !== itemId) }),
        );
        setActiveItemId(null);
      }
      return result;
    });

  const handleAddItem = () =>
    run(async () => {
      const result = await addItemAction({ listId: list.id, item: newItem });
      if (result.ok) {
        setList((current) =>
          recalc({
            ...current,
            items: [
              ...current.items,
              {
                id: result.data.id,
                name: newItem.name.trim(),
                quantity: newItem.quantity,
                unit: newItem.unit,
                price: null,
                purchased: false,
                subtotal: 0,
              },
            ],
          }),
        );
        setNewItem({ name: "", quantity: 1, unit: "un" });
        setAddOpen(false);
      }
      return result;
    });

  const handleFinish = () =>
    run(async () => {
      const result = await finishShopping(list.id);
      if (result.ok) {
        router.replace(`/finalizadas/${list.id}`);
        router.refresh();
      }
      return result;
    });

  const handleDelete = () =>
    run(async () => {
      const result = await deleteList(list.id);
      if (result.ok) {
        router.replace("/");
        router.refresh();
      }
      return result;
    });

  const shopping = list.status === "shopping";

  return (
    <>
      <PageHeader
        title={list.name}
        subtitle={
          shopping
            ? `Iniciada ${formatDayAndHour(list.startedAt)}`
            : `${list.itemsCount} ${list.itemsCount === 1 ? "item" : "itens"} cadastrados`
        }
        backHref="/"
        action={
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Opções da lista"
            className="border-line bg-surface text-muted grid size-10 shrink-0 place-items-center rounded-full border text-lg leading-none font-bold"
          >
            ⋯
          </button>
        }
      />

      <main className="flex-1 px-4 pb-40">
        {shopping ? (
          <>
            <section className="border-brand/30 bg-brand-soft mb-4 rounded-[var(--radius-card)] border p-4">
              <p className="text-brand-ink/80 text-[12px] font-semibold tracking-wide uppercase">
                Total parcial
              </p>
              <p className="text-brand-ink mt-0.5 text-[34px] leading-none font-extrabold tabular-nums">
                {brl(list.total)}
              </p>
              <div className="bg-brand/15 mt-3.5 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-brand h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-brand-ink/80 mt-2 text-[12.5px] font-medium">
                {list.purchasedCount} de {list.itemsCount} itens no carrinho
              </p>
            </section>

            {pendingItems.length > 0 ? (
              <section className="mb-4">
                <h2 className="text-muted mb-2 px-1 text-[12px] font-semibold tracking-wide uppercase">
                  Faltam pegar · {pendingItems.length}
                </h2>
                <ul className="border-line bg-surface divide-line divide-y overflow-hidden rounded-[var(--radius-card)] border">
                  {pendingItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setActiveItemId(item.id)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[var(--surface-2)]"
                      >
                        <span className="border-line size-6 shrink-0 rounded-full border-2" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">{item.name}</span>
                          <span className="text-muted block text-[12.5px]">
                            {formatQuantity(item.quantity)} {item.unit}
                          </span>
                        </span>
                        <span className="text-brand shrink-0 text-[13px] font-semibold">
                          Informar valor
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="border-line bg-surface mb-4 flex items-center gap-3 rounded-[var(--radius-card)] border p-4">
                <span className="bg-brand grid size-9 shrink-0 place-items-center rounded-full text-white">
                  <CheckIcon className="size-5 stroke-[2.6]" />
                </span>
                <p className="text-[14px] font-medium">
                  Carrinho completo! É só finalizar a compra.
                </p>
              </section>
            )}

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="border-line text-muted mb-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed py-3.5 text-sm font-medium transition-transform active:scale-[0.99]"
            >
              <PlusIcon className="size-4.5" />
              Adicionar produto fora da lista
            </button>

            {cartItems.length > 0 ? (
              <section>
                <h2 className="text-muted mb-2 px-1 text-[12px] font-semibold tracking-wide uppercase">
                  No carrinho · {cartItems.length}
                </h2>
                <ul className="border-line bg-surface divide-line divide-y overflow-hidden rounded-[var(--radius-card)] border">
                  {cartItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setActiveItemId(item.id)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[var(--surface-2)]"
                      >
                        <span className="bg-brand grid size-6 shrink-0 place-items-center rounded-full text-white">
                          <CheckIcon className="size-3.5 stroke-[3]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">{item.name}</span>
                          <span className="text-muted block text-[12.5px] tabular-nums">
                            {formatQuantity(item.quantity)} {item.unit} × {brl(item.price ?? 0)}
                          </span>
                        </span>
                        <span className="shrink-0 text-[15px] font-bold tabular-nums">
                          {brl(item.subtotal)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : (
          <>
            <section className="border-line bg-surface mb-4 rounded-[var(--radius-card)] border p-5 text-center">
              <span className="bg-brand-soft text-brand-ink mx-auto mb-3 grid size-14 place-items-center rounded-2xl">
                <PlayIcon className="size-6" />
              </span>
              <h2 className="text-[17px] font-semibold">Pronto para ir ao mercado</h2>
              <p className="text-muted mx-auto mt-1 max-w-xs text-[13.5px] leading-relaxed">
                Ao iniciar, a data e a hora ficam registradas e você passa a informar o valor de cada
                produto.
              </p>
            </section>

            <h2 className="text-muted mb-2 px-1 text-[12px] font-semibold tracking-wide uppercase">
              Itens da lista · {list.itemsCount}
            </h2>
            <ul className="border-line bg-surface divide-line divide-y overflow-hidden rounded-[var(--radius-card)] border">
              {list.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="border-line size-2 shrink-0 rounded-full border-4" />
                  <span className="min-w-0 flex-1 truncate text-[15px]">{item.name}</span>
                  <span className="text-muted shrink-0 text-[13px] font-medium tabular-nums">
                    {formatQuantity(item.quantity)} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {error ? (
          <p className="bg-danger-soft text-danger mt-4 rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </p>
        ) : null}
      </main>

      {/* Barra de ação fixa */}
      <div className="border-line bg-bg/90 safe-bottom fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl">
        <div className="mx-auto w-full max-w-lg px-4 py-3">
          {shopping ? (
            <button
              type="button"
              onClick={() => setFinishOpen(true)}
              disabled={pending || list.purchasedCount === 0}
              className="bg-brand flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-white transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              <span className="text-[15px] font-semibold">Finalizar compra</span>
              <span className="text-[17px] font-bold tabular-nums">{brl(list.total)}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={pending || list.itemsCount === 0}
              className="bg-brand flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              <PlayIcon className="size-4.5" />
              {pending ? "Iniciando…" : "Iniciar compra"}
            </button>
          )}
        </div>
      </div>

      <PriceSheet
        item={activeItem}
        saving={pending}
        onClose={() => setActiveItemId(null)}
        onConfirm={(price) => activeItem && handlePrice(activeItem.id, price)}
        onClear={() => activeItem && handleClear(activeItem.id)}
        onRemove={() => activeItem && handleRemoveItem(activeItem.id)}
      />

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adicionar produto"
        description="Aquele item que você lembrou só no corredor."
      >
        <input
          value={newItem.name}
          onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))}
          placeholder="Nome do produto"
          autoComplete="off"
          className="bg-surface-2 w-full rounded-2xl px-4 py-3.5 text-[16px] outline-none placeholder:text-[var(--muted)]"
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-muted text-[13px]">Quantidade</span>
          <div className="bg-surface-2 flex items-center rounded-xl">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() =>
                setNewItem((current) => ({
                  ...current,
                  quantity: Math.max(0.25, round2(current.quantity - 1)),
                }))
              }
              className="grid size-10 place-items-center text-lg font-semibold"
            >
              −
            </button>
            <span className="w-12 text-center text-[15px] font-semibold tabular-nums">
              {formatQuantity(newItem.quantity)}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() =>
                setNewItem((current) => ({ ...current, quantity: round2(current.quantity + 1) }))
              }
              className="grid size-10 place-items-center text-lg font-semibold"
            >
              +
            </button>
          </div>
        </div>
        <div className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1">
          {UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => setNewItem((current) => ({ ...current, unit }))}
              className={`flex-1 shrink-0 rounded-lg px-2.5 py-2 text-[13px] font-medium ${
                newItem.unit === unit ? "bg-brand text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          disabled={pending || !newItem.name.trim()}
          className="bg-brand mt-4 w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Adicionar
        </button>
      </Sheet>

      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Finalizar compra"
        description={`Data e hora do fim serão gravadas em ${formatDayAndHour(new Date().toISOString())}.`}
      >
        <div className="bg-surface-2 flex items-center justify-between rounded-2xl px-4 py-3.5">
          <span className="text-[13px] font-medium">Total gasto</span>
          <span className="text-brand text-2xl font-extrabold tabular-nums">{brl(list.total)}</span>
        </div>

        {pendingItems.length > 0 ? (
          <div className="bg-warn-soft text-warn mt-3 flex gap-2.5 rounded-2xl p-3.5">
            <AlertIcon className="mt-0.5 size-4.5 shrink-0" />
            <p className="text-[12.5px] leading-snug">
              {pendingItems.length} {pendingItems.length === 1 ? "item continua" : "itens continuam"}{" "}
              sem valor e não {pendingItems.length === 1 ? "entrará" : "entrarão"} no total.
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleFinish}
          disabled={pending}
          className="bg-brand mt-4 w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Finalizando…" : "Confirmar e finalizar"}
        </button>
      </Sheet>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Opções da lista">
        <div className="space-y-2">
          <Link
            href={`/listas/${list.id}/editar`}
            className="bg-surface-2 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-medium"
          >
            <PencilIcon className="text-muted size-5" />
            Editar itens da lista
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="bg-danger-soft text-danger flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-medium disabled:opacity-40"
          >
            <TrashIcon className="size-5" />
            Excluir lista
          </button>
          {list.startedAt ? (
            <p className="text-muted flex items-center gap-2 px-1 pt-2 text-[12.5px]">
              <ClockIcon className="size-4" />
              Compra iniciada em {formatDayAndHour(list.startedAt)}
            </p>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
