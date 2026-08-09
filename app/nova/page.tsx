import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ListForm } from "@/components/ListForm";

export const metadata: Metadata = {
  title: "Nova lista",
};

export default function NovaListaPage() {
  return (
    <>
      <PageHeader
        title="Nova lista"
        subtitle="Cadastre os produtos e as quantidades"
        backHref="/"
      />
      <main className="flex-1">
        <ListForm mode="create" />
      </main>
    </>
  );
}
