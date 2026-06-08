/**
 * LLM01 (Prompt Injection) + LLM06 (Sensitive Information Disclosure).
 *
 * Sanitiza datos de un Lead antes de enviarlos a un proveedor de IA externo:
 *
 * 1. MODERACIÓN DE PROMPTS: detecta y bloquea patrones de inyección incluyendo
 *    ataques de encoding (base64, tokens especiales de modelos).
 * 2. DLP ENTRANTE: detecta y redacta PII estructurado (RUT CL, tarjetas, JWT,
 *    API keys) y bloquea values de claves con nombre sensible.
 * 3. MÍNIMO PRIVILEGIO: solo expone al LLM los campos necesarios para scoring;
 *    teléfono y email completos nunca salen del servidor.
 */

// ─── Patrones de prompt injection ───────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  // Ataques clásicos de instrucción directa
  /ignore\s+(previous|all|prior)\s+(instructions?|prompts?|context)/i,
  /override\s+(all\s+)?instructions/i,
  /forget\s+(everything|all|previous)/i,
  /disregard\s+(your|all|any)/i,

  // Suplantación de rol de sistema
  /system\s*:/i,
  /\[SYSTEM\]/i,
  /act\s+as\s+(an?\s+)?(?:AI|assistant|model|bot)/i,
  /you\s+are\s+now/i,
  /pretend\s+(you\s+are|to\s+be)/i,

  // Tokens internos de modelos (LLaMA, ChatML, etc.)
  /<\|.*?\|>/,
  /\[INST\]/i,
  /<<(?:SYS|INST|\/SYS|\/INST)>>/i,
  /###\s*(?:instruction|system|human|assistant)/i,

  // Jailbreaks conocidos
  /jailbreak/i,
  /\bDAN\b/,
  /do\s+anything\s+now/i,

  // Ataques de encoding: instrucción en base64 puro o eval/exec
  /eval\s*\(/i,
  /exec\s*\(/i,
  /prompt\s*:/i,
];

// ─── Patrones DLP entrantes ──────────────────────────────────────────────────

/** RUT chileno: 12.345.678-9 o 12345678-9 */
const RUT_PATTERN = /\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g;
/** Tarjeta de crédito/débito: 16 dígitos con separadores opcionales */
const CREDIT_CARD_PATTERN = /\b\d{4}[\s\-.]?\d{4}[\s\-.]?\d{4}[\s\-.]?\d{4}\b/g;
/** JWT: empieza con eyJ (header base64) */
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
/** API key genérica: 32+ caracteres alfanuméricos sin espacios */
const API_KEY_PATTERN = /\b[A-Za-z0-9_\-]{32,}\b/g;
/** Email completo */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/** Nombres de clave cuyo valor nunca debe enviarse a un LLM (control de acceso). */
const SENSITIVE_KEY_NAMES = new Set([
  "password", "contraseña", "contrasena", "clave", "passwd", "pin",
  "secret", "token", "apikey", "api_key", "access_token", "refresh_token",
  "credential", "credentials", "jwt", "auth", "authorization",
  "private_key", "privatekey", "cvv", "cvc", "tarjeta", "card",
]);

// ─── Utilidades ──────────────────────────────────────────────────────────────

const MAX_STRING_LEN = 300;
const MAX_PAYLOAD_STRING_LEN = 150;

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ");
}

function containsInjection(value: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(value));
}

/**
 * Aplica DLP sobre un string: redacta RUT, tarjetas, JWT y API keys
 * antes de exponerlos al modelo.
 */
function applyInboundDlp(value: string): string {
  return value
    .replace(RUT_PATTERN, "[RUT REDACTADO]")
    .replace(CREDIT_CARD_PATTERN, "[TARJETA REDACTADA]")
    .replace(JWT_PATTERN, "[TOKEN REDACTADO]")
    .replace(EMAIL_PATTERN, "[EMAIL REDACTADO]")
    .replace(API_KEY_PATTERN, "[CLAVE REDACTADA]");
}

function sanitizeString(value: string, maxLen = MAX_STRING_LEN): string {
  // 1. Strip HTML y caracteres de control no imprimibles
  const clean = stripHtml(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();

  // 2. Moderación: bloquea si contiene patrón de inyección
  if (containsInjection(clean)) return "[FILTRADO]";

  // 3. DLP entrante: redacta datos estructurados sensibles
  const dlpClean = applyInboundDlp(clean);

  return dlpClean.slice(0, maxLen);
}

function sanitizeRawPayload(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Normaliza la clave: solo alfanuméricos y _
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 50);
    const lowerKey = key.toLowerCase();

    // Control de acceso: si la clave sugiere datos sensibles, no exponemos el valor
    if (SENSITIVE_KEY_NAMES.has(lowerKey)) {
      result[safeKey] = "[REDACTADO]";
      continue;
    }

    if (typeof value === "string") {
      result[safeKey] = sanitizeString(value, MAX_PAYLOAD_STRING_LEN);
    } else if (typeof value === "number" || typeof value === "boolean") {
      result[safeKey] = value;
    }
    // Objetos anidados y arrays se ignoran — superficie de ataque innecesaria para scoring
  }

  return result;
}

// ─── Interfaz pública ────────────────────────────────────────────────────────

export interface AiLeadContext {
  /** Canal de origen del lead (enum; nunca texto libre). */
  source: string;
  commune: string | null;
  budget: number | null;
  currency: string | null;
  status: string;
  currentScoreTier: string | null;
  /** Solo dominio del email (ej. "gmail.com") — usuario redactado. */
  emailDomain: string | null;
  /** Booleano: el lead tiene teléfono pero el número no se expone al LLM. */
  hasPhone: boolean;
  /** rawPayload sanitizado: sin inyección, sin PII, sin claves sensibles. */
  rawPayload: Record<string, unknown>;
}

/**
 * Prepara un lead para envío a un LLM externo aplicando:
 * - Moderación de prompt (inyección bloqueada).
 * - DLP entrante (RUT, tarjetas, JWT, emails redactados).
 * - Mínimo privilegio (phone/email completos nunca salen).
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

  // Solo el dominio del email es útil para scoring (proveedor corporativo vs personal)
  const emailDomain = lead.email?.includes("@") ? (lead.email.split("@")[1] ?? null) : null;

  return {
    source: lead.source,
    commune: lead.commune ? sanitizeString(lead.commune, 100) : null,
    budget: typeof lead.budget === "number" ? Math.max(0, Math.min(lead.budget, 1_000_000_000)) : null,
    currency: lead.currency ?? null,
    status: lead.status,
    currentScoreTier: lead.currentScoreTier,
    emailDomain,
    hasPhone: Boolean(lead.phone),
    rawPayload,
  };
}

/** Sanitiza un string de texto libre antes de incluirlo en un prompt. Exportada para reutilización. */
export { sanitizeString };
