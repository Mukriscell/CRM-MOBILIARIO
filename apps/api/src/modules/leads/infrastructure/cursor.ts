/** Cursor opaco basado en (createdAt, id) — paginación estable (FASE 9 §7). */
export interface CursorData {
  createdAt: string;
  id: string;
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null): CursorData | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as CursorData;
  } catch {
    return null;
  }
}
