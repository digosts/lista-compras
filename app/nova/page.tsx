import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ListForm } from "@/components/ListForm";
import { getItemSuggestions } from "@/lib/reports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nova lista",
};

export default async function NovaListaPage() {
  const suggestions = await getItemSuggestions();

  return (
    <>
      <PageHeader
        title="Nova lista"
        subtitle="Cadastre os produtos e as quantidades"
        backHref="/"
      />
      <main className="flex-1">
        <ListForm mode="create" suggestions={suggestions} />
      </main>
    </>
  );
}
