/**
 * LLM02 (Insecure Output Handling) + DLP saliente.
 *
 * Valida y normaliza la respuesta de un proveedor de IA antes de usarla:
 * 1. Clamp scoreValue al rango 0–100.
 * 2. Recalcula tier desde el score (nunca confiar en el tier del LLM).
 * 3. Limita cantidad y longitud de reasons; sanitiza HTML (anti-XSS).
 * 4. DLP saliente: redacta PII que el LLM pudiera haber incluido en reasons
 *    (RUT, tarjetas, JWT, emails) antes de devolver al caller.
 */

import { ScoreResult, classifyTier } from "../../modules/lead-scoring/domain/lead-score.entity";

const MAX_REASONS = 10;
const MAX_DESCRIPTION_LEN = 200;
const SAFE_RULE_PATTERN = /^[a-z0-9_]{1,50}$/;

// ─── DLP saliente ────────────────────────────────────────────────────────────
// El LLM podría "memorizar" y filtrar PII de su contexto de entrenamiento.
// Escanear la salida antes de exponerla al caller.

const OUTBOUND_DLP: Array<[RegExp, string]> = [
  [/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g, "[RUT]"],
  [/\b\d{4}[\s\-.]?\d{4}[\s\-.]?\d{4}[\s\-.]?\d{4}\b/g, "[TARJETA]"],
  [/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, "[TOKEN]"],
  [/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[EMAIL]"],
];

function applyOutboundDlp(text: string): string {
  let result = text;
  for (const [pattern, replacement] of OUTBOUND_DLP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

// ─── Validador principal ─────────────────────────────────────────────────────

/**
 * Valida la salida cruda de un LLM y devuelve un ScoreResult garantizado
 * dentro de los invariantes del dominio. Aplica DLP saliente en descriptions.
 */
export function validateAiScoreOutput(raw: unknown): ScoreResult {
  if (!raw || typeof raw !== "object") {
    return { scoreValue: 50, tier: "WARM", reasons: [] };
  }

  const obj = raw as Record<string, unknown>;

  // scoreValue: número entero 0–100
  let scoreValue = typeof obj.scoreValue === "number" ? Math.round(obj.scoreValue) : 50;
  if (!Number.isFinite(scoreValue)) scoreValue = 50;
  scoreValue = Math.min(100, Math.max(0, scoreValue));

  // tier: siempre recalculado desde el score — jamás se confía en el tier del LLM
  const tier = classifyTier(scoreValue);

  // reasons: array limitado, sanitizado y con DLP saliente
  const rawReasons = Array.isArray(obj.reasons) ? obj.reasons : [];
  const reasons = rawReasons
    .slice(0, MAX_REASONS)
    .filter((r): r is object => typeof r === "object" && r !== null)
    .map((r) => {
      const reason = r as Record<string, unknown>;

      const rawRule = typeof reason.rule === "string" ? reason.rule : "unknown";
      const rule = SAFE_RULE_PATTERN.test(rawRule) ? rawRule : "unknown_rule";

      const rawDelta = typeof reason.delta === "number" ? reason.delta : 0;
      const delta = Number.isFinite(rawDelta) ? Math.min(100, Math.max(-100, Math.round(rawDelta))) : 0;

      const rawDesc = typeof reason.description === "string" ? reason.description : "";
      // Strip HTML → DLP saliente → truncar
      const description = applyOutboundDlp(stripTags(rawDesc)).slice(0, MAX_DESCRIPTION_LEN);

      return { rule, delta, description };
    });

  return { scoreValue, tier, reasons };
}
