"use client";

import { useEffect, useId, useRef } from "react";
import { CloseIcon } from "@/components/icons";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

/** Bottom sheet no estilo dos apps nativos: sobe de baixo, fecha no backdrop ou Esc. */
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-sheet-in bg-surface safe-bottom relative w-full max-w-lg rounded-t-[var(--radius-sheet)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-semibold">
              {title}
            </h2>
            {description ? <p className="text-muted mt-0.5 text-sm">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="bg-surface-2 text-muted -mt-1 grid size-9 shrink-0 place-items-center rounded-full transition-transform active:scale-90"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="px-5 pt-2 pb-6">{children}</div>
      </div>
    </div>
  );
}
