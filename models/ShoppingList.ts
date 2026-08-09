import { Schema, model, models, Types, type Model } from "mongoose";

export const LIST_STATUS = ["open", "shopping", "done"] as const;
export type ListStatus = (typeof LIST_STATUS)[number];

export interface IItem {
  _id: Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  /** Preço unitário informado durante a compra (em R$). `null` = ainda não precificado. */
  price: number | null;
  purchased: boolean;
}

export interface IShoppingList {
  _id: Types.ObjectId;
  name: string;
  status: ListStatus;
  items: Types.DocumentArray<IItem>;
  /** Momento em que o botão "Iniciar compra" foi acionado. */
  startedAt: Date | null;
  finishedAt: Date | null;
  /** Total gasto, congelado no momento em que a compra é finalizada. */
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    quantity: { type: Number, required: true, default: 1, min: 0.001 },
    unit: { type: String, default: "un", trim: true, maxlength: 12 },
    price: { type: Number, default: null, min: 0 },
    purchased: { type: Boolean, default: false },
  },
  { _id: true },
);

const ShoppingListSchema = new Schema<IShoppingList>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: LIST_STATUS, default: "open", index: true },
    items: { type: [ItemSchema], default: [] },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    total: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

ShoppingListSchema.index({ status: 1, finishedAt: -1 });

export const ShoppingList =
  (models.ShoppingList as Model<IShoppingList>) ??
  model<IShoppingList>("ShoppingList", ShoppingListSchema);
