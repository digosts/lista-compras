import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getList } from "@/lib/lists";
import { PageHeader } from "@/components/PageHeader";
import { ListForm } from "@/components/ListForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Editar lista" };

type Props = { params: Promise<{ id: string }> };

export default async function EditarListaPage({ params }: Props) {
  const { id } = await params;
  const list = await getList(id);

  if (!list) notFound();
  if (list.status === "done") redirect(`/finalizadas/${list.id}`);

  return (
    <>
      <PageHeader
        title="Editar lista"
        subtitle={list.name}
        backHref={`/listas/${list.id}`}
      />
      <main className="flex-1">
        <ListForm
          mode="edit"
          listId={list.id}
          initialName={list.name}
          initialItems={list.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          }))}
        />
      </main>
    </>
  );
}
