import "server-only";
import { connectDB } from "@/lib/mongodb";
import { ShoppingList, type ListStatus } from "@/models/ShoppingList";
import { round2 } from "@/lib/format";

export type ItemDTO = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number | null;
  purchased: boolean;
  /** quantidade × preço unitário */
  subtotal: number;
};

export type ListDTO = {
  id: string;
  name: string;
  status: ListStatus;
  items: ItemDTO[];
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string | null;
  /** Total congelado (compras finalizadas) ou parcial (compra em andamento). */
  total: number;
  itemsCount: number;
  purchasedCount: number;
};

type RawItem = {
  _id: unknown;
  name: string;
  quantity: number;
  unit?: string | null;
  price?: number | null;
  purchased?: boolean | null;
};

type RawList = {
  _id: unknown;
  name: string;
  status: ListStatus;
  items?: RawItem[] | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt?: Date | null;
  total?: number | null;
};

export function itemSubtotal(item: { quantity: number; price: number | null }) {
  if (item.price == null) return 0;
  return round2(item.quantity * item.price);
}

/** Soma apenas o que foi efetivamente marcado como comprado e precificado. */
export function computeTotal(items: Pick<ItemDTO, "quantity" | "price" | "purchased">[]) {
  return round2(
    items.reduce((acc, item) => (item.purchased ? acc + itemSubtotal(item) : acc), 0),
  );
}

function toDTO(doc: RawList): ListDTO {
  const items: ItemDTO[] = (doc.items ?? []).map((item) => {
    const price = item.price ?? null;
    const quantity = item.quantity ?? 1;
    return {
      id: String(item._id),
      name: item.name,
      quantity,
      unit: item.unit || "un",
      price,
      purchased: Boolean(item.purchased),
      subtotal: itemSubtotal({ quantity, price }),
    };
  });

  return {
    id: String(doc._id),
    name: doc.name,
    status: doc.status,
    items,
    startedAt: doc.startedAt ? new Date(doc.startedAt).toISOString() : null,
    finishedAt: doc.finishedAt ? new Date(doc.finishedAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    total: doc.status === "done" ? (doc.total ?? 0) : computeTotal(items),
    itemsCount: items.length,
    purchasedCount: items.filter((item) => item.purchased).length,
  };
}

/** Compras ainda não finalizadas: cadastradas (`open`) e em andamento (`shopping`). */
export async function getOpenLists(): Promise<ListDTO[]> {
  await connectDB();
  const docs = await ShoppingList.find({ status: { $in: ["open", "shopping"] } })
    .sort({ status: -1, updatedAt: -1 })
    .lean();
  return docs.map((doc) => toDTO(doc as unknown as RawList));
}

export async function getFinishedLists(): Promise<ListDTO[]> {
  await connectDB();
  const docs = await ShoppingList.find({ status: "done" })
    .sort({ finishedAt: -1 })
    .lean();
  return docs.map((doc) => toDTO(doc as unknown as RawList));
}

export async function getList(id: string): Promise<ListDTO | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  const doc = await ShoppingList.findById(id).lean();
  return doc ? toDTO(doc as unknown as RawList) : null;
}

export type FinishedStats = { count: number; total: number; average: number };

export function summarizeFinished(lists: ListDTO[]): FinishedStats {
  const total = round2(lists.reduce((acc, list) => acc + list.total, 0));
  return {
    count: lists.length,
    total,
    average: lists.length ? round2(total / lists.length) : 0,
  };
}
