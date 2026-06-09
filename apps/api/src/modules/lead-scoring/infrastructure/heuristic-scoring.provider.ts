import { Injectable } from "@nestjs/common";
import { Lead } from "@prisma/client";
import { IScoringProvider } from "../domain/scoring-provider.interface";
import { ScoreReason, ScoreResult, classifyTier } from "../domain/lead-score.entity";

/**
 * Peso de intención por canal de origen del lead. Solo canales de alta intención
 * suman; redes/ads/whatsapp quedan en 0 (baseline neutro, sin penalizar).
 */
const SOURCE_INTENT_WEIGHTS = {
  REFERIDO: 12, // recomendación directa — la mayor intención
  PORTAL: 8, // búsqueda activa en portal inmobiliario
  WEB_FORM: 5, // completó un formulario web
  LANDING: 3, // llegó por una landing
} as const;

/**
 * Motor de scoring heurístico (H3, mejorado).
 * Reglas determinísticas sobre señales financieras y de intención del lead;
 * sin dependencias externas — corre en memoria, sin latencia, explicable.
 */
@Injectable()
export class HeuristicScoringProvider implements IScoringProvider {
  async score(lead: Lead): Promise<ScoreResult> {
    let total = 0;
    const reasons: ScoreReason[] = [];
    const raw = lead.rawPayload as Record<string, unknown> | null;

    // Señales financieras: campos del modelo tienen prioridad, rawPayload como fallback
    const subsidyEligible = lead.subsidyEligible ?? (raw?.subsidyEligible === true);
    const creditStatus = (lead.creditStatus !== "NONE" ? lead.creditStatus : (raw?.creditStatus as string | null)) ?? "NONE";
    const downPayment = lead.downPayment !== null ? Number(lead.downPayment) : (typeof raw?.downPayment === "number" ? raw.downPayment : null);
    const budgetAmount = lead.budgetAmount !== null ? Number(lead.budgetAmount) : (typeof raw?.budgetAmount === "number" ? raw.budgetAmount : null);
    const monthlyIncome = typeof raw?.monthlyIncome === "number" ? raw.monthlyIncome : null;
    const estimatedMortgage = typeof raw?.estimatedMortgage === "number" ? raw.estimatedMortgage : null;

    // +40 subsidio disponible
    if (subsidyEligible) {
      total += 40;
      reasons.push({ rule: "subsidy_eligible", delta: 40, description: "Subsidio disponible" });
    }

    // +15 crédito preaprobado
    if (creditStatus === "PRE_APPROVED" || creditStatus === "APPROVED") {
      total += 15;
      reasons.push({ rule: "credit_preapproved", delta: 15, description: "Crédito preaprobado" });
    }

    // +30 pie >= 20% | -20 pie < 5%
    if (downPayment !== null && budgetAmount !== null && budgetAmount > 0) {
      const piePct = (downPayment / budgetAmount) * 100;
      if (piePct >= 20) {
        total += 30;
        reasons.push({ rule: "down_payment_high", delta: 30, description: `Pie ${piePct.toFixed(0)}% del presupuesto (≥ 20%)` });
      } else if (piePct < 5) {
        total -= 20;
        reasons.push({ rule: "down_payment_low", delta: -20, description: `Pie ${piePct.toFixed(0)}% del presupuesto (< 5%)` });
      }
    }

    // +20 dividendo <= 25% ingreso | -30 dividendo > 45%
    if (monthlyIncome !== null && estimatedMortgage !== null && monthlyIncome > 0) {
      const divPct = (estimatedMortgage / monthlyIncome) * 100;
      if (divPct <= 25) {
        total += 20;
        reasons.push({ rule: "dividend_low", delta: 20, description: `Dividendo ${divPct.toFixed(0)}% del ingreso (≤ 25%)` });
      } else if (divPct > 45) {
        total -= 30;
        reasons.push({ rule: "dividend_high", delta: -30, description: `Dividendo ${divPct.toFixed(0)}% del ingreso (> 45%)` });
      }
    }

    // +10 ingreso familiar alto
    if (monthlyIncome !== null && monthlyIncome >= 3_000_000) {
      total += 10;
      reasons.push({ rule: "high_income", delta: 10, description: "Ingreso familiar alto (≥ $3.000.000)" });
    }

    // ── Señales de intención (no financieras) ────────────────────────────────

    // Urgencia declarada de compra (campo del modelo, rawPayload como fallback)
    const urgency = (lead.urgency ?? (raw?.urgency as string | null)) ?? null;
    if (urgency === "HIGH") {
      total += 15;
      reasons.push({ rule: "urgency_high", delta: 15, description: "Urgencia de compra alta" });
    } else if (urgency === "MEDIUM") {
      total += 5;
      reasons.push({ rule: "urgency_medium", delta: 5, description: "Urgencia de compra media" });
    } else if (urgency === "LOW") {
      total -= 5;
      reasons.push({ rule: "urgency_low", delta: -5, description: "Urgencia de compra baja" });
    }

    // Intención según el canal de origen: un referido o un portal inmobiliario
    // traen más intención de compra que tráfico de redes/ads.
    const sourceWeight =
      SOURCE_INTENT_WEIGHTS[lead.source as keyof typeof SOURCE_INTENT_WEIGHTS] ?? 0;
    if (sourceWeight > 0) {
      total += sourceWeight;
      reasons.push({
        rule: "source_intent",
        delta: sourceWeight,
        description: `Fuente de alta intención (${lead.source})`,
      });
    }

    // El lead ya mira una propiedad concreta → intención fuerte
    if (lead.interestedPropertyId) {
      total += 10;
      reasons.push({ rule: "interested_property", delta: 10, description: "Interesado en una propiedad concreta" });
    }

    // Ya enganchado: respondió y está en conversación
    if (lead.firstResponseAt) {
      total += 5;
      reasons.push({ rule: "engaged", delta: 5, description: "Lead ya respondió (en conversación)" });
    }

    const scoreValue = Math.max(0, Math.min(100, total));
    return { scoreValue, tier: classifyTier(scoreValue), reasons };
  }
}
