import Link from "next/link";
import type { Route } from "next";
import { AlertIcon } from "@/components/icons";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: Route;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="bg-surface text-muted border-line mb-4 grid size-16 place-items-center rounded-3xl border">
        {icon}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-muted mt-1 max-w-xs text-sm leading-relaxed">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="bg-brand mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** Mostrado quando o MongoDB não responde — sem quebrar o app inteiro. */
export function DbErrorState({ message }: { message: string }) {
  return (
    <div className="px-4 py-8">
      <div className="border-line bg-surface rounded-[var(--radius-card)] border p-5">
        <div className="text-danger bg-danger-soft mb-3 grid size-11 place-items-center rounded-xl">
          <AlertIcon className="size-5" />
        </div>
        <h2 className="text-base font-semibold">Banco de dados indisponível</h2>
        <p className="text-muted mt-1.5 text-sm leading-relaxed">{message}</p>
        <div className="bg-surface-2 text-muted mt-4 rounded-xl p-3 font-mono text-[12px] leading-relaxed">
          <p className="text-ink mb-1 font-sans text-[12px] font-semibold">
            .env.local na raiz do projeto
          </p>
          MONGODB_URI=mongodb://127.0.0.1:27017/lista-compras
        </div>
      </div>
    </div>
  );
}
