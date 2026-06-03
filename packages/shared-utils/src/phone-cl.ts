/**
 * Normalización de teléfonos chilenos a formato E.164 (+569XXXXXXXX).
 * Clave para la deduplicación de leads (FASE 8: índice [tenantId, phone]).
 */
export function normalizeChileanPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Ya viene con código país 56
  if (digits.startsWith("56")) {
    const rest = digits.slice(2);
    return rest.length >= 9 ? `+56${rest.slice(0, 9)}` : null;
  }
  // Móvil nacional de 9 dígitos (empieza con 9)
  if (digits.length === 9 && digits.startsWith("9")) {
    return `+56${digits}`;
  }
  // 8 dígitos (sin el 9 inicial) → asumir móvil
  if (digits.length === 8) {
    return `+569${digits}`;
  }
  return null;
}

export function isValidChileanPhone(raw: string | null | undefined): boolean {
  return normalizeChileanPhone(raw) !== null;
}
