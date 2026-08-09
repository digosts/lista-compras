"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteList, reopenShopping } from "@/app/actions";
import { Sheet } from "@/components/Sheet";
import { PencilIcon, TrashIcon } from "@/components/icons";

export function FinishedActions({ listId }: { listId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reopen = () =>
    startTransition(async () => {
      const result = await reopenShopping(listId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(`/listas/${listId}`);
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deleteList(listId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/finalizadas");
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Opções da compra"
        className="border-line bg-surface text-muted grid size-10 shrink-0 place-items-center rounded-full border text-lg leading-none font-bold"
      >
        ⋯
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Opções da compra">
        <div className="space-y-2">
          <button
            type="button"
            onClick={reopen}
            disabled={pending}
            className="bg-surface-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium disabled:opacity-40"
          >
            <PencilIcon className="text-muted size-5" />
            <span>
              Reabrir para corrigir
              <span className="text-muted block text-[12.5px] font-normal">
                Volta para o modo de compra sem perder os valores.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="bg-danger-soft text-danger flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-medium disabled:opacity-40"
          >
            <TrashIcon className="size-5" />
            Excluir do histórico
          </button>
          {error ? <p className="text-danger px-1 text-[13px]">{error}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
