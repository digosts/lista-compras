import type { Metadata } from "next";
import { getReport, type ConsumptionRow, type PriceVariation, type Report } from "@/lib/reports";
import { brl, formatDateTime, formatMonthKey, formatPercent, formatQuantity } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { MonthlyChart } from "@/components/MonthlyChart";
import { DbErrorState, EmptyState } from "@/components/States";
import { ChartIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Relatório" };

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 px-1">
        <h2 className="text-muted text-[12px] font-semibold tracking-wide uppercase">{title}</h2>
        {hint ? <p className="text-muted text-[12.5px]">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border-line bg-surface overflow-hidden rounded-[var(--radius-card)] border ${className}`}
    >
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-muted px-4 py-5 text-center text-[13.5px]">{children}</p>;
}

/** Linha de preço por compra; o último ponto marcado. */
function Sparkline({ points }: { points: PriceVariation["points"] }) {
  const width = 72;
  const height = 28;
  const pad = 4;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const range = Math.max(...prices) - min || 1;
  const coords = prices.map((price, index) => [
    pad + (index / (prices.length - 1)) * (width - pad * 2),
    height - pad - ((price - min) / range) * (height - pad * 2),
  ]);
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-[72px] shrink-0" aria-hidden="true">
      <polyline
        points={coords.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={3} fill="var(--brand)" stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  );
}

function PriceVariations({ rows }: { rows: PriceVariation[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <Muted>
          Ainda não há produtos comprados mais de uma vez com preços diferentes.
        </Muted>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="divide-line divide-y">
        {rows.map((row) => (
          <li key={`${row.name}|${row.unit}`} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{row.name}</p>
              <p className="text-muted text-[12.5px] tabular-nums">
                {brl(row.min)} → {brl(row.max)} /{row.unit} · {row.points.length} compras
              </p>
              <p className="text-muted text-[12px] tabular-nums">
                Último: {brl(row.last)}{" "}
                <span className={row.trend > 0 ? "text-danger" : row.trend < 0 ? "text-brand-ink" : ""}>
                  ({formatPercent(row.trend)} desde a 1ª compra)
                </span>
              </p>
            </div>
            <Sparkline points={row.points} />
            <span className="bg-warn-soft text-warn w-16 shrink-0 rounded-lg py-1 text-center text-[13px] font-bold tabular-nums">
              {formatPercent(row.variation)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MonthlyTable({ months }: { months: Report["months"] }) {
  return (
    <table className="w-full text-[13px] tabular-nums">
      <thead className="text-muted text-[11.5px] font-semibold uppercase">
        <tr className="border-line border-b">
          <th className="px-4 py-2 text-left font-semibold">Mês</th>
          <th className="py-2 text-right font-semibold">Compras</th>
          <th className="py-2 text-right font-semibold">Total</th>
          <th className="px-4 py-2 text-right font-semibold">Variação</th>
        </tr>
      </thead>
      <tbody className="divide-line divide-y">
        {[...months].reverse().map((month) => (
          <tr key={month.key}>
            <td className="px-4 py-2.5 capitalize">{formatMonthKey(month.key)}</td>
            <td className="py-2.5 text-right">{month.count}</td>
            <td className="py-2.5 text-right font-semibold">{brl(month.total)}</td>
            <td
              className={`px-4 py-2.5 text-right font-semibold ${
                month.change == null || month.change === 0
                  ? "text-muted"
                  : month.change > 0
                    ? "text-danger"
                    : "text-brand-ink"
              }`}
            >
              {month.change == null ? "—" : formatPercent(month.change)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConsumptionTable({
  rows,
  variant,
}: {
  rows: ConsumptionRow[];
  variant: "most" | "least";
}) {
  return (
    <table className="w-full table-fixed text-[13px] tabular-nums">
      <thead className="text-muted text-[11.5px] uppercase">
        <tr className="border-line border-b">
          <th className="px-4 py-2 text-left font-semibold">Produto</th>
          <th className="w-[4.5rem] py-2 text-right font-semibold">Compras</th>
          <th className="w-[6.5rem] px-4 py-2 text-right font-semibold">
            {variant === "most" ? "Qtd. total" : "Última"}
          </th>
        </tr>
      </thead>
      <tbody className="divide-line divide-y">
        {rows.map((row) => (
          <tr key={row.name}>
            <td className="px-4 py-2.5">
              <span className="block truncate font-medium">{row.name}</span>
              <span className="text-muted block text-[11.5px]">{brl(row.totalSpent)} no total</span>
            </td>
            <td className="py-2.5 text-right font-semibold">{row.timesBought}×</td>
            <td className="text-muted px-4 py-2.5 text-right text-[12.5px]">
              {variant === "most"
                ? `${formatQuantity(row.totalQuantity)} ${row.unit}`
                : formatDateTime(row.lastBoughtAt).split(",")[0]}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function RelatorioPage() {
  let report: Report | null = null;
  let dbError: string | null = null;

  try {
    report = await getReport();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Erro ao acessar o banco de dados.";
  }

  return (
    <>
      <PageHeader
        title="Relatório"
        subtitle={
          report && report.purchasesCount > 0
            ? `Com base em ${report.purchasesCount} compra${report.purchasesCount > 1 ? "s" : ""} finalizada${report.purchasesCount > 1 ? "s" : ""}`
            : undefined
        }
      />

      <main className="flex-1 px-4 pb-32">
        {dbError ? (
          <DbErrorState message={dbError} />
        ) : report && report.purchasesCount > 0 ? (
          <div className="space-y-6">
            <Section title="Gasto por mês" hint="Toque numa barra para ver o mês">
              <Card className="p-4">
                <MonthlyChart months={report.months} />
              </Card>
              <Card className="mt-3">
                <MonthlyTable months={report.months} />
              </Card>
            </Section>

            <Section
              title="Maior variação de preço"
              hint="Diferença entre o menor e o maior preço unitário pago"
            >
              <PriceVariations rows={report.priceVariations} />
            </Section>

            <Section title="Mais consumidos" hint="Produtos presentes em mais compras">
              <Card>
                {report.mostConsumed.length > 0 ? (
                  <ConsumptionTable rows={report.mostConsumed} variant="most" />
                ) : (
                  <Muted>Nenhum produto se repetiu em mais de uma compra ainda.</Muted>
                )}
              </Card>
            </Section>

            <Section title="Menos repetidos" hint="Produtos que pouco voltaram a outras compras">
              <Card>
                {report.leastRepeated.length > 0 ? (
                  <ConsumptionTable rows={report.leastRepeated} variant="least" />
                ) : (
                  <Muted>Todos os produtos já aparecem entre os mais consumidos.</Muted>
                )}
              </Card>
            </Section>
          </div>
        ) : (
          <EmptyState
            icon={<ChartIcon className="size-7" />}
            title="Sem dados para o relatório"
            description="Finalize algumas compras informando os preços e os gráficos aparecem aqui."
            actionLabel="Ver listas em aberto"
            actionHref="/"
          />
        )}
      </main>
    </>
  );
}
