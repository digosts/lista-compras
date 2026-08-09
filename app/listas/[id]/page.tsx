import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getList, type ListDTO } from "@/lib/lists";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { PageHeader } from "@/components/PageHeader";
import { DbErrorState } from "@/components/States";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const list = await getList(id);
    return { title: list?.name ?? "Lista" };
  } catch {
    return { title: "Lista" };
  }
}

export default async function ListaPage({ params }: Props) {
  const { id } = await params;

  let list: ListDTO | null = null;
  let dbError: string | null = null;

  try {
    list = await getList(id);
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Erro ao acessar o banco de dados.";
  }

  if (dbError) {
    return (
      <>
        <PageHeader title="Lista" backHref="/" />
        <main className="flex-1">
          <DbErrorState message={dbError} />
        </main>
      </>
    );
  }

  if (!list) notFound();
  if (list.status === "done") redirect(`/finalizadas/${list.id}`);

  return <ShoppingScreen initialList={list} />;
}
