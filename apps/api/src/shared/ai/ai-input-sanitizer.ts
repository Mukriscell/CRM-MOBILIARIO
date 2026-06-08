/**
 * LLM01 (Prompt Injection) + LLM06 (Sensitive Information Disclosure).
 *
 * Sanitiza datos de un Lead antes de enviarlos a un proveedor de IA externo:
 * - Elimina HTML y caracteres de control.
 * - Detecta y bloquea patrones de prompt injection.
 * - Pseudoanonimiza PII (teléfono, email) que no son necesarios para el scoring.
 * - Limita longitud de strings para evitar ataques DoS al modelo (LLM04).
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|prior)\s+(instructions?|prompts?|context)/i,
  /system\s*:/i,
  /\[SYSTEM\]/i,
  /act\s+as\s+(an?\s+)?(?:AI|assistant|model|bot)/i,
  /jailbreak/i,
  /override\s+(all\s+)?instructions/i,
  /forget\s+(everything|all|previous)/i,
  /you\s+are\s+now/i,
  /disregard\s+(your|all|any)/i,
  /<\|.*?\|>/,
];

const MAX_STRING_LEN = 300;
const MAX_PAYLOAD_STRING_LEN = 150;

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ");
}

function containsInjection(value: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(value));
}

function sanitizeString(value: string, maxLen = MAX_STRING_LEN): string {
  const clean = stripHtml(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (containsInjection(clean)) return "[FILTRADO]";
  return clean.slice(0, maxLen);
}

function sanitizeRawPayload(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Normaliza la clave: solo alfanuméricos y _ (LLM01)
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 50);
    if (typeof value === "string") {
      result[safeKey] = sanitizeString(value, MAX_PAYLOAD_STRING_LEN);
    } else if (typeof value === "number" || typeof value === "boolean") {
      result[safeKey] = value;
    }
    // Objetos anidados y arrays se ignoran — superficie de ataque innecesaria para scoring
  }
  return result;
}

export interface AiLeadContext {
  source: string;
  commune: string | null;
  budget: number | null;
  currency: string | null;
  status: string;
  currentScoreTier: string | null;
  emailDomain: string | null;
  hasPhone: boolean;
  rawPayload: Record<string, unknown>;
}

/**
 * Prepara un lead para envío a un LLM externo.
 * PII (teléfono completo, email completo) se excluye o pseudoanonimiza.
 */
export function sanitizeLeadForAi(lead: {
  source: string;
  phone: string | null;
  email: string | null;
  commune: string | null;
  budget: number | null;
  currency: string | null;
  status: string;
  currentScoreTier: string | null;
  rawPayload: unknown;
}): AiLeadContext {
  const rawPayload =
    typeof lead.rawPayload === "object" && lead.rawPayload !== null
      ? sanitizeRawPayload(lead.rawPayload as Record<string, unknown>)
      : {};

  const emailDomain = lead.email?.includes("@") ? lead.email.split("@")[1] ?? null : null;

  return {
    source: lead.source,
    commune: lead.commune ? sanitizeString(lead.commune, 100) : null,
    budget: typeof lead.budget === "number" ? Math.max(0, Math.min(lead.budget, 1_000_000_000)) : null,
    currency: lead.currency ?? null,
    status: lead.status,
    currentScoreTier: lead.currentScoreTier,
    // Solo se expone el dominio del email (no el usuario) y si hay teléfono (boolean)
    emailDomain,
    hasPhone: Boolean(lead.phone),
    rawPayload,
  };
}

/** Sanitiza un string de texto libre antes de incluirlo en un prompt. */
export { sanitizeString };
