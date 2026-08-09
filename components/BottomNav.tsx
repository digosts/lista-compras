"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartIcon, PlusIcon, ReceiptIcon } from "@/components/icons";

const TABS = [
  { href: "/", label: "Em aberto", Icon: CartIcon },
  { href: "/finalizadas", label: "Finalizadas", Icon: ReceiptIcon },
] as const;

/** Rotas de fluxo focado (compra, formulário) escondem a navegação. */
function shouldHide(pathname: string) {
  return pathname.startsWith("/listas/") || pathname === "/nova" || pathname === "/offline";
}

export function BottomNav() {
  const pathname = usePathname();
  if (shouldHide(pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-lg">
        <div className="border-line bg-surface/85 safe-bottom border-t backdrop-blur-xl">
          <div className="relative grid grid-cols-2">
            {TABS.map(({ href, label, Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 px-4 pt-2.5 pb-3 text-[11px] font-medium transition-colors ${
                    active ? "text-brand" : "text-muted"
                  }`}
                >
                  <Icon className={`size-6 ${active ? "stroke-[2.1]" : ""}`} />
                  {label}
                </Link>
              );
            })}

            {/* Botão de ação principal, flutuando acima da barra. */}
            <Link
              href="/nova"
              aria-label="Criar nova lista"
              className="bg-brand absolute -top-7 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg shadow-black/25 ring-4 ring-[var(--bg)] transition-transform active:scale-95"
            >
              <PlusIcon className="size-7 stroke-[2.4]" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
