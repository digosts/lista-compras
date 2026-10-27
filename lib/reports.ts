import "server-only";
import { connectDB } from "@/lib/mongodb";
import { ShoppingList } from "@/models/ShoppingList";
import { itemKey, monthKey, round2 } from "@/lib/format";

/** Um item efetivamente comprado (precificado) numa compra finalizada. */
type PurchaseEntry = {
  key: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  listId: string;
  finishedAt: string;
};

export type RawDoneList = {
  _id: unknown;
  finishedAt?: Date | null;
  total?: number | null;
  items?: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
    price?: number | null;
    purchased?: boolean | null;
  }[];
};

async function getDoneLists() {
  await connectDB();
  const docs = await ShoppingList.find({ status: "done", finishedAt: { $ne: null } })
    .select({ finishedAt: 1, total: 1, items: 1 })
    .sort({ finishedAt: 1 })
    .lean();
  return docs as unknown as RawDoneList[];
}

/** Histórico em ordem cronológica (mais antigo primeiro). */
function toEntries(lists: RawDoneList[]): PurchaseEntry[] {
  return lists.flatMap((list) =>
    (list.items ?? [])
      .filter((item) => item.purchased && item.price != null)
      .map((item) => ({
        key: itemKey(item.name),
        name: item.name.trim(),
        unit: item.unit || "un",
        quantity: item.quantity ?? 1,
        price: item.price!,
        listId: String(list._id),
        finishedAt: new Date(list.finishedAt!).toISOString(),
      })),
  );
}

function groupBy<T>(values: T[], keyOf: (value: T) => string) {
  const groups = new Map<string, T[]>();
  for (const value of values) {
    const key = keyOf(value);
    const bucket = groups.get(key);
    if (bucket) bucket.push(value);
    else groups.set(key, [value]);
  }
  return groups;
}

export type ItemSuggestion = {
  name: string;
  /** Unidade e quantidade da compra mais recente. */
  unit: string;
  quantity: number;
  /** Em quantas compras finalizadas o item apareceu. */
  timesBought: number;
};

/**
 * Produtos já comprados, do mais frequente para o menos — alimenta o cadastro de listas.
 * Sem banco não há sugestões, mas o formulário continua funcionando.
 */
export async function getItemSuggestions(): Promise<ItemSuggestion[]> {
  let lists: RawDoneList[];
  try {
    lists = await getDoneLists();
  } catch {
    return [];
  }
  const entries = toEntries(lists);
  return [...groupBy(entries, (entry) => entry.key).values()]
    .map((group) => {
      const last = group[group.length - 1];
      return {
        name: last.name,
        unit: last.unit,
        quantity: last.quantity,
        timesBought: new Set(group.map((entry) => entry.listId)).size,
      };
    })
    .sort((a, b) => b.timesBought - a.timesBought || a.name.localeCompare(b.name, "pt-BR"));
}

export type PriceVariation = {
  name: string;
  unit: string;
  first: number;
  last: number;
  min: number;
  max: number;
  /** (máx − mín) / mín, em % */
  variation: number;
  /** (último − primeiro) / primeiro, em % */
  trend: number;
  points: { price: number; finishedAt: string }[];
};

export type MonthTotal = {
  key: string;
  total: number;
  count: number;
  /** Variação em relação ao mês anterior com compras; `null` no primeiro mês. */
  change: number | null;
};

export type ConsumptionRow = {
  name: string;
  unit: string;
  timesBought: number;
  totalQuantity: number;
  totalSpent: number;
  lastBoughtAt: string;
};

export type Report = {
  purchasesCount: number;
  priceVariations: PriceVariation[];
  months: MonthTotal[];
  mostConsumed: ConsumptionRow[];
  leastRepeated: ConsumptionRow[];
};

/** ["2026-07", "2026-10"] → ["2026-07", "2026-08", "2026-09", "2026-10"] */
function monthRange(sortedKeys: string[]) {
  if (sortedKeys.length === 0) return [];
  const [startYear, startMonth] = sortedKeys[0].split("-").map(Number);
  const end = sortedKeys[sortedKeys.length - 1];
  const keys: string[] = [];
  for (let index = 0; ; index++) {
    const date = new Date(Date.UTC(startYear, startMonth - 1 + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
    if (key >= end) return keys;
  }
}

function percent(from: number, to: number) {
  return from > 0 ? round2(((to - from) / from) * 100) : 0;
}

export async function getReport(): Promise<Report> {
  return buildReport(await getDoneLists());
}

/** Separado da consulta para poder ser exercitado com dados de exemplo. */
export function buildReport(lists: RawDoneList[]): Report {
  const entries = toEntries(lists);

  // Preço só é comparável dentro da mesma unidade (R$/kg ≠ R$/un).
  const priceVariations = [...groupBy(entries, (entry) => `${entry.key}|${entry.unit}`).values()]
    .filter((group) => group.length >= 2)
    .map((group) => {
      const prices = group.map((entry) => entry.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return {
        name: group[group.length - 1].name,
        unit: group[0].unit,
        first: prices[0],
        last: prices[prices.length - 1],
        min,
        max,
        variation: percent(min, max),
        trend: percent(prices[0], prices[prices.length - 1]),
        points: group.map((entry) => ({ price: entry.price, finishedAt: entry.finishedAt })),
      };
    })
    .filter((row) => row.max > row.min)
    .sort((a, b) => b.variation - a.variation)
    .slice(0, 5);

  const byMonth = groupBy(lists, (list) => monthKey(new Date(list.finishedAt!).toISOString()));
  const months: MonthTotal[] = [];
  // Meses sem compra entram zerados: o gráfico não pode pular de agosto para outubro.
  for (const key of monthRange([...byMonth.keys()])) {
    const monthLists = byMonth.get(key) ?? [];
    const total = round2(monthLists.reduce((acc, list) => acc + (list.total ?? 0), 0));
    const previous = months[months.length - 1];
    months.push({
      key,
      total,
      count: monthLists.length,
      change: previous && previous.total > 0 ? percent(previous.total, total) : null,
    });
  }

  const consumption: ConsumptionRow[] = [...groupBy(entries, (entry) => entry.key).values()].map(
    (group) => {
      const last = group[group.length - 1];
      return {
        name: last.name,
        unit: last.unit,
        timesBought: new Set(group.map((entry) => entry.listId)).size,
        totalQuantity: round2(group.reduce((acc, entry) => acc + entry.quantity, 0)),
        totalSpent: round2(group.reduce((acc, entry) => acc + entry.quantity * entry.price, 0)),
        lastBoughtAt: last.finishedAt,
      };
    },
  );

  // Só é "mais consumido" o que voltou em pelo menos duas compras.
  const mostConsumed = consumption
    .filter((row) => row.timesBought >= 2)
    .sort((a, b) => b.timesBought - a.timesBought || b.totalQuantity - a.totalQuantity)
    .slice(0, 10);
  const shown = new Set(mostConsumed.map((row) => row.name));
  const leastRepeated = consumption
    .filter((row) => !shown.has(row.name))
    .sort(
      (a, b) =>
        a.timesBought - b.timesBought ||
        a.lastBoughtAt.localeCompare(b.lastBoughtAt) ||
        a.name.localeCompare(b.name, "pt-BR"),
    )
    .slice(0, 10);

  return {
    purchasesCount: lists.length,
    priceVariations,
    months,
    mostConsumed,
    leastRepeated,
  };
}
