import { AddToHomeIcon, CheckIcon, ShareIosIcon } from "@/components/icons";

const STEPS = [
  {
    Icon: ShareIosIcon,
    title: "Toque em Compartilhar",
    body: "É o ícone de quadrado com a seta para cima, na barra inferior do Safari.",
  },
  {
    Icon: AddToHomeIcon,
    title: 'Escolha "Adicionar à Tela de Início"',
    body: "Role a lista de opções até encontrar. Depois confirme em Adicionar.",
  },
  {
    Icon: CheckIcon,
    title: "Abra pelo ícone novo",
    body: "O app abre em tela cheia, sem a barra do navegador — igual a um app da App Store.",
  },
];

export function IosInstallSteps() {
  return (
    <ol className="space-y-3">
      {STEPS.map(({ Icon, title, body }, index) => (
        <li key={title} className="bg-surface-2 flex gap-3 rounded-2xl p-3.5">
          <div className="bg-surface text-brand grid size-10 shrink-0 place-items-center rounded-xl">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {index + 1}. {title}
            </p>
            <p className="text-muted mt-0.5 text-[13px] leading-snug">{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
