import { Injectable, Logger } from "@nestjs/common";
import { Lead } from "@prisma/client";
import { IScoringProvider } from "../domain/scoring-provider.interface";
import { ScoreResult, classifyTier } from "../domain/lead-score.entity";
import { sanitizeLeadForAi } from "../../../shared/ai/ai-input-sanitizer";
import { validateAiScoreOutput } from "../../../shared/ai/ai-output-validator";

/**
 * Adaptador de IA preparado para conectar OpenAI / Anthropic.
 *
 * Patrón de seguridad implementado (OWASP LLM Top 10):
 *   - LLM01: sanitizeLeadForAi() filtra prompt injection y limita strings antes del prompt.
 *   - LLM02: validateAiScoreOutput() valida y clampea la respuesta del modelo.
 *   - LLM06: sanitizeLeadForAi() excluye PII (email completo, teléfono) del prompt.
 *
 * Para activar:
 *   1. Instalar el SDK: pnpm add openai (o @anthropic-ai/sdk)
 *   2. Implementar el cuerpo de score() con la llamada al modelo.
 *   3. Cambiar lead-scoring.module.ts para proveer AIScoringProvider.
 */
@Injectable()
export class AIScoringProvider implements IScoringProvider {
  private readonly logger = new Logger(AIScoringProvider.name);

  async score(lead: Lead): Promise<ScoreResult> {
    // Sanitiza el lead antes de construir cualquier prompt (LLM01 + LLM06).
    // safeContext se usa al construir el prompt real con OpenAI/Anthropic.
    void sanitizeLeadForAi({
      source: lead.source,
      phone: lead.phone,
      email: lead.email,
      commune: (lead as unknown as Record<string, unknown>).commune as string | null,
      budget: (lead as unknown as Record<string, unknown>).budget as number | null,
      currency: (lead as unknown as Record<string, unknown>).currency as string | null,
      status: lead.status,
      currentScoreTier: lead.currentScoreTier,
      rawPayload: lead.rawPayload,
    });

    this.logger.debug(`AIScoringProvider invocado para lead ${lead.id} — proveedor aún no configurado`);

    // TODO(H6): Construir prompt con safeContext y llamar al modelo.
    // La respuesta cruda debe pasarse SIEMPRE por validateAiScoreOutput() antes de usarla.
    // Ejemplo:
    //   const rawResponse = await this.openai.chat.completions.create({ ... });
    //   return validateAiScoreOutput(JSON.parse(rawResponse.choices[0].message.content ?? "{}"));

    // Stub: score neutro hasta que se conecte el proveedor real
    const stubResult = { scoreValue: 50, tier: classifyTier(50), reasons: [] };
    return validateAiScoreOutput(stubResult);
  }
}
