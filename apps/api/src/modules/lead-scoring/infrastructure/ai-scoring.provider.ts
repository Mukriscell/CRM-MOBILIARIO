import { Injectable } from "@nestjs/common";
import { Lead } from "@prisma/client";
import { IScoringProvider } from "../domain/scoring-provider.interface";
import { ScoreResult, classifyTier } from "../domain/lead-score.entity";

/**
 * Adaptador de IA preparado para H4+.
 * Mientras el proveedor real no esté configurado devuelve score neutro (50/WARM).
 * Sustituir el cuerpo de score() cuando se conecte OpenAI / Anthropic.
 */
@Injectable()
export class AIScoringProvider implements IScoringProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async score(_lead: Lead): Promise<ScoreResult> {
    return {
      scoreValue: 50,
      tier: classifyTier(50),
      reasons: [{ rule: "ai_stub", delta: 0, description: "Proveedor de IA no configurado (H4+)" }],
    };
  }
}
