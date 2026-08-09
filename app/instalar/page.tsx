import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { InstallPanel } from "@/components/InstallPanel";

export const metadata: Metadata = {
  title: "Instalar o app",
};

export default function InstalarPage() {
  return (
    <>
      <PageHeader
        title="Instalar o app"
        subtitle="Deixe a lista na tela de início do celular"
        backHref="/"
      />
      <main className="flex-1 px-4 pb-32">
        <InstallPanel />
      </main>
    </>
  );
}
