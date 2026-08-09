import mongoose from "mongoose";

declare global {
  var _mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cache = (global._mongooseCache ??= { conn: null, promise: null });

export class DatabaseError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Conexão única reaproveitada entre requisições (e entre hot reloads em dev).
 */
export async function connectDB() {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new DatabaseError(
      "MONGODB_URI não configurada. Copie .env.example para .env.local e informe a string de conexão.",
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .catch((err) => {
        cache.promise = null;
        throw new DatabaseError(
          "Não foi possível conectar ao MongoDB. Verifique se o servidor está no ar e se MONGODB_URI está correta.",
          err,
        );
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
