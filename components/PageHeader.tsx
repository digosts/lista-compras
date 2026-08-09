import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import type { Route } from "next";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: Route;
  action?: React.ReactNode;
  sticky?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={`bg-bg/85 safe-top z-30 backdrop-blur-xl ${sticky ? "sticky top-0" : ""}`}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Voltar"
            className="border-line bg-surface -ml-1 grid size-10 shrink-0 place-items-center rounded-full border transition-transform active:scale-90"
          >
            <ChevronLeftIcon className="size-5" />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] leading-tight font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-muted truncate text-[13px]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </header>
  );
}
