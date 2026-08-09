import Link from "next/link";
import { getOpenLists, type ListDTO } from "@/lib/lists";
import { PageHeader } from "@/components/PageHeader";
import { OpenListCard } from "@/components/ListCard";
import { DbErrorState, EmptyState } from "@/components/States";
import { BagIcon, PlusIcon } from "@/components/icons";
import { InstallShortcut } from "@/components/InstallShortcut";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let lists: ListDTO[] | null = null;
  let dbError: string | null = null;

  try {
    lists = await getOpenLists();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Erro ao acessar o banco de dados.";
  }

  const shoppingNow = lists?.filter((list) => list.status === "shopping").length ?? 0;

  return (
    <>
      <PageHeader
        title="Compras em aberto"
        subtitle={
          dbError
            ? undefined
            : shoppingNow > 0
              ? `${shoppingNow} compra${shoppingNow > 1 ? "s" : ""} em andamento agora`
              : `${lists?.length ?? 0} lista${lists?.length === 1 ? "" : "s"} aguardando`
        }
        action={<InstallShortcut />}
      />

      <main className="flex-1 px-4 pb-32">
        {dbError ? (
          <DbErrorState message={dbError} />
        ) : lists && lists.length > 0 ? (
          <div className="space-y-3">
            {lists.map((list, index) => (
              <OpenListCard key={list.id} list={list} index={index} />
            ))}

            <Link
              href="/nova"
              className="border-line text-muted flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed py-4 text-sm font-medium transition-transform active:scale-[0.985]"
            >
              <PlusIcon className="size-4.5" />
              Nova lista de compras
            </Link>
          </div>
        ) : (
          <EmptyState
            icon={<BagIcon className="size-7" />}
            title="Nenhuma lista por aqui"
            description="Cadastre os produtos que você precisa comprar e leve a lista para o mercado."
            actionLabel="Criar primeira lista"
            actionHref="/nova"
          />
        )}
      </main>
    </>
  );
}
