"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createList, updateList, type ItemInput } from "@/app/actions";
import { formatQuantity } from "@/lib/format";
import { PlusIcon, TrashIcon } from "@/components/icons";

const UNITS = ["un", "kg", "g", "L", "ml", "cx", "pct", "dz"] as const;

type DraftItem = ItemInput & { key: string };

let keySeed = 0;
const nextKey = () => `item-${++keySeed}-${Date.now()}`;

export function ListForm({
  mode,
  listId,
  initialName = "",
  initialItems = [],
}: {
  mode: "create" | "edit";
  listId?: string;
  initialName?: string;
  initialItems?: ItemInput[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [items, setItems] = useState<DraftItem[]>(() =>
    initialItems.map((item) => ({ ...item, key: nextKey() })),
  );
  const [draftName, setDraftName] = useState("");
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [draftUnit, setDraftUnit] = useState<string>("un");
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<HTMLInputElement>(null);

  const addDraft = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      draftRef.current?.focus();
      return;
    }
    setItems((current) => [
      ...current,
      { key: nextKey(), name: trimmed, quantity: draftQuantity, unit: draftUnit },
    ]);
    setDraftName("");
    setDraftQuantity(1);
    setError(null);
    draftRef.current?.focus();
  };

  const changeQuantity = (key: string, delta: number) => {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.max(0.25, Math.round((item.quantity + delta) * 100) / 100) }
          : item,
      ),
    );
  };

  const removeItem = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const submit = () => {
    setError(null);
    const payload = {
      name,
      items: items.map(({ name: itemName, quantity, unit }) => ({ name: itemName, quantity, unit })),
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createList(payload)
          : await updateList({ id: listId!, ...payload });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(`/listas/${result.data.id}`);
      router.refresh();
    });
  };

  return (
    <>
      <div className="space-y-4 px-4 pb-40">
        <div className="border-line bg-surface rounded-[var(--radius-card)] border p-4">
          <label htmlFor="list-name" className="text-muted text-[12px] font-semibold tracking-wide uppercase">
            Nome da lista
          </label>
          <input
            id="list-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Compra do mês, Feira da semana…"
            autoComplete="off"
            enterKeyHint="next"
            className="mt-1.5 w-full bg-transparent text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-[var(--muted)]"
          />
        </div>

        <div className="border-line bg-surface rounded-[var(--radius-card)] border p-4">
          <p className="text-muted text-[12px] font-semibold tracking-wide uppercase">
            Adicionar produto
          </p>

          <input
            ref={draftRef}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addDraft();
              }
            }}
            placeholder="Arroz, leite, sabão em pó…"
            autoComplete="off"
            enterKeyHint="done"
            className="border-line mt-1.5 w-full border-b pb-2 text-[16px] outline-none placeholder:text-[var(--muted)]"
          />

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-muted text-[13px]">Quantidade</span>
            <div className="bg-surface-2 flex items-center rounded-xl">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                onClick={() => setDraftQuantity((q) => Math.max(0.25, Math.round((q - 1) * 100) / 100))}
                className="grid size-10 place-items-center text-lg font-semibold"
              >
                −
              </button>
              <span className="w-12 text-center text-[15px] font-semibold tabular-nums">
                {formatQuantity(draftQuantity)}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={() => setDraftQuantity((q) => Math.round((q + 1) * 100) / 100)}
                className="grid size-10 place-items-center text-lg font-semibold"
              >
                +
              </button>
            </div>
          </div>

          {/* Unidades em linha própria: na largura de um celular elas não cabem ao lado do stepper. */}
          <div className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1">
            {UNITS.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => setDraftUnit(unit)}
                className={`flex-1 shrink-0 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  draftUnit === unit ? "bg-brand text-white" : "bg-surface-2 text-muted"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={addDraft}
            className="bg-brand-soft text-brand-ink mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
          >
            <PlusIcon className="size-4.5 stroke-[2.4]" />
            Adicionar à lista
          </button>
        </div>

        {items.length > 0 ? (
          <div className="border-line bg-surface overflow-hidden rounded-[var(--radius-card)] border">
            <div className="border-line flex items-center justify-between border-b px-4 py-3">
              <p className="text-muted text-[12px] font-semibold tracking-wide uppercase">
                Itens da lista
              </p>
              <span className="text-muted text-[12px] font-semibold">{items.length}</span>
            </div>
            <ul className="divide-line divide-y">
              {items.map((item) => (
                <li key={item.key} className="flex items-center gap-2 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[15px]">{item.name}</span>

                  <div className="bg-surface-2 flex items-center rounded-lg">
                    <button
                      type="button"
                      aria-label={`Diminuir ${item.name}`}
                      onClick={() => changeQuantity(item.key, -1)}
                      className="grid size-8 place-items-center font-semibold"
                    >
                      −
                    </button>
                    <span className="min-w-12 text-center text-[13px] font-semibold tabular-nums">
                      {formatQuantity(item.quantity)} {item.unit}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar ${item.name}`}
                      onClick={() => changeQuantity(item.key, 1)}
                      className="grid size-8 place-items-center font-semibold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remover ${item.name}`}
                    onClick={() => removeItem(item.key)}
                    className="text-muted grid size-8 shrink-0 place-items-center rounded-lg"
                  >
                    <TrashIcon className="size-4.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p className="bg-danger-soft text-danger rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </p>
        ) : null}
      </div>

      <div className="border-line bg-bg/90 safe-bottom fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl">
        <div className="mx-auto w-full max-w-lg px-4 py-3">
          <button
            type="button"
            onClick={submit}
            disabled={pending || !name.trim() || items.length === 0}
            className="bg-brand w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
          >
            {pending
              ? "Salvando…"
              : mode === "create"
                ? "Salvar lista"
                : "Salvar alterações"}
          </button>
        </div>
      </div>
    </>
  );
}
