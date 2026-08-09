"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { ShoppingList } from "@/models/ShoppingList";
import { computeTotal, itemSubtotal, type ListDTO } from "@/lib/lists";
import { round2 } from "@/lib/format";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: never } : { data: T }))
  | { ok: false; error: string };

export type ItemInput = {
  name: string;
  quantity: number;
  unit: string;
};

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function sanitizeItems(items: ItemInput[]) {
  return items
    .map((item) => ({
      name: String(item.name ?? "").trim().slice(0, 120),
      quantity: Number(item.quantity),
      unit: (String(item.unit ?? "un").trim() || "un").slice(0, 12),
    }))
    .filter((item) => item.name.length > 0)
    .map((item) => ({
      ...item,
      quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
    }));
}

function revalidateAll(id?: string) {
  revalidatePath("/");
  revalidatePath("/finalizadas");
  if (id) {
    revalidatePath(`/listas/${id}`);
    revalidatePath(`/finalizadas/${id}`);
  }
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
}

export async function createList(input: {
  name: string;
  items: ItemInput[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const name = String(input.name ?? "").trim();
    if (!name) return fail("Dê um nome para a lista.");

    const items = sanitizeItems(input.items ?? []);
    if (items.length === 0) return fail("Adicione pelo menos um item à lista.");

    await connectDB();
    const created = await ShoppingList.create({ name, items, status: "open" });
    revalidateAll();
    return { ok: true, data: { id: String(created._id) } };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

export async function updateList(input: {
  id: string;
  name: string;
  items: ItemInput[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const name = String(input.name ?? "").trim();
    if (!name) return fail("Dê um nome para a lista.");

    const items = sanitizeItems(input.items ?? []);
    if (items.length === 0) return fail("Adicione pelo menos um item à lista.");

    await connectDB();
    const list = await ShoppingList.findById(input.id);
    if (!list) return fail("Lista não encontrada.");
    if (list.status === "done") return fail("Compras finalizadas não podem ser editadas.");

    list.name = name;
    // Preserva preço/marcação dos itens que continuam na lista (comparando pelo nome).
    const previous = new Map(
      list.items.map((item) => [item.name.toLowerCase(), item] as const),
    );
    list.set(
      "items",
      items.map((item) => {
        const kept = previous.get(item.name.toLowerCase());
        return {
          ...item,
          price: kept?.price ?? null,
          purchased: kept?.purchased ?? false,
        };
      }),
    );
    await list.save();

    revalidateAll(input.id);
    return { ok: true, data: { id: input.id } };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

export async function deleteList(id: string): Promise<ActionResult> {
  try {
    await connectDB();
    await ShoppingList.findByIdAndDelete(id);
    revalidateAll(id);
    return { ok: true };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

/** Botão "Iniciar compra": grava a data/hora atual e libera o modo de compra. */
export async function startShopping(id: string): Promise<ActionResult> {
  try {
    await connectDB();
    const list = await ShoppingList.findById(id);
    if (!list) return fail("Lista não encontrada.");
    if (list.status === "done") return fail("Esta compra já foi finalizada.");

    list.status = "shopping";
    list.startedAt = new Date();
    await list.save();

    revalidateAll(id);
    return { ok: true };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

/**
 * Informa o valor unitário de um item durante a compra.
 * O subtotal é sempre preço × quantidade cadastrada na lista.
 */
export async function setItemPrice(input: {
  listId: string;
  itemId: string;
  price: number | null;
}): Promise<ActionResult<{ subtotal: number; total: number }>> {
  try {
    const price =
      input.price == null || !Number.isFinite(input.price) ? null : round2(Math.max(0, input.price));

    await connectDB();
    const list = await ShoppingList.findById(input.listId);
    if (!list) return fail("Lista não encontrada.");
    if (list.status === "done") return fail("Esta compra já foi finalizada.");

    const item = list.items.id(input.itemId);
    if (!item) return fail("Item não encontrado.");

    item.price = price;
    item.purchased = price != null;
    if (list.status === "open") {
      list.status = "shopping";
      list.startedAt ??= new Date();
    }
    await list.save();

    const items = list.items.map((entry) => ({
      quantity: entry.quantity,
      price: entry.price ?? null,
      purchased: Boolean(entry.purchased),
    }));

    revalidateAll(input.listId);
    return {
      ok: true,
      data: {
        subtotal: itemSubtotal({ quantity: item.quantity, price }),
        total: computeTotal(items),
      },
    };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

/** Desmarca um item já precificado (voltou o produto para a prateleira). */
export async function clearItemPrice(input: {
  listId: string;
  itemId: string;
}): Promise<ActionResult<{ total: number }>> {
  const result = await setItemPrice({ ...input, price: null });
  if (!result.ok) return result;
  return { ok: true, data: { total: result.data.total } };
}

/** Adiciona um item que não estava na lista, já no meio da compra. */
export async function addItem(input: {
  listId: string;
  item: ItemInput;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const [item] = sanitizeItems([input.item]);
    if (!item) return fail("Informe o nome do produto.");

    await connectDB();
    const list = await ShoppingList.findById(input.listId);
    if (!list) return fail("Lista não encontrada.");
    if (list.status === "done") return fail("Esta compra já foi finalizada.");

    list.items.push({ ...item, price: null, purchased: false });
    await list.save();

    const created = list.items[list.items.length - 1];
    revalidateAll(input.listId);
    return { ok: true, data: { id: String(created._id) } };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

export async function removeItem(input: {
  listId: string;
  itemId: string;
}): Promise<ActionResult> {
  try {
    await connectDB();
    const list = await ShoppingList.findById(input.listId);
    if (!list) return fail("Lista não encontrada.");
    if (list.status === "done") return fail("Esta compra já foi finalizada.");

    list.items.pull({ _id: input.itemId });
    await list.save();

    revalidateAll(input.listId);
    return { ok: true };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

/** Encerra a compra: grava a data/hora do fim e congela o total gasto. */
export async function finishShopping(id: string): Promise<ActionResult<{ total: number }>> {
  try {
    await connectDB();
    const list = await ShoppingList.findById(id);
    if (!list) return fail("Lista não encontrada.");
    if (list.status === "done") return fail("Esta compra já foi finalizada.");
    if (!list.items.some((item) => item.purchased)) {
      return fail("Informe o valor de pelo menos um item antes de finalizar.");
    }

    const total = computeTotal(
      list.items.map((item) => ({
        quantity: item.quantity,
        price: item.price ?? null,
        purchased: Boolean(item.purchased),
      })),
    );

    list.status = "done";
    list.total = total;
    list.finishedAt = new Date();
    list.startedAt ??= list.finishedAt;
    await list.save();

    revalidateAll(id);
    return { ok: true, data: { total } };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

/** Reabre uma compra finalizada para correções. */
export async function reopenShopping(id: string): Promise<ActionResult> {
  try {
    await connectDB();
    const list = await ShoppingList.findById(id);
    if (!list) return fail("Compra não encontrada.");

    list.status = "shopping";
    list.finishedAt = null;
    await list.save();

    revalidateAll(id);
    return { ok: true };
  } catch (err) {
    return fail(errorMessage(err));
  }
}

export type { ListDTO };
