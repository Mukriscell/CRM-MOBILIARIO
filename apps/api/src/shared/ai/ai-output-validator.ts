/**
 * LLM02 (Insecure Output Handling).
 *
 * Valida y normaliza la respuesta de un proveedor de IA antes de usarla:
 * - Clamp del scoreValue al rango 0–100.
 * - Recalcula el tier desde el score (nunca confiar en el tier del LLM).
 * - Limita cantidad y longitud de reasons.
 * - Sanitiza strings en reasons para evitar XSS si se renderiza en frontend.
 */

import { ScoreResult, classifyTier } from "../../modules/lead-scoring/domain/lead-score.entity";

const MAX_REASONS = 10;
const MAX_DESCRIPTION_LEN = 200;
const SAFE_RULE_PATTERN = /^[a-z0-9_]{1,50}$/;

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

/**
 * Valida la salida cruda de un LLM y devuelve un ScoreResult garantizado
 * dentro de los invariantes del dominio.
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

  // tier: siempre recalculado desde el score para evitar manipulación
  const tier = classifyTier(scoreValue);

  // reasons: array limitado y sanitizado
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
      const description = stripTags(rawDesc).slice(0, MAX_DESCRIPTION_LEN);

      return { rule, delta, description };
    });

  return { scoreValue, tier, reasons };
}
