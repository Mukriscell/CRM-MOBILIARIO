import { describe, it, expect, beforeEach, vi } from "vitest";
import { AIScoringProvider } from "../infrastructure/ai-scoring.provider";
import { HeuristicScoringProvider } from "../infrastructure/heuristic-scoring.provider";

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead-1",
    tenantId: "tenant-1",
    firstName: "Test",
    lastName: "Lead",
    email: null,
    phone: null,
    source: "WHATSAPP",
    status: "NUEVO",
    budgetAmount: null,
    budgetCurrency: "CLP",
    downPayment: null,
    creditStatus: "NONE",
    subsidyEligible: null,
    urgency: null,
    assignedUserId: null,
    interestedPropertyId: null,
    currentScoreTier: null,
    firstResponseAt: null,
    lastActivityAt: new Date(),
    lostReason: null,
    rawPayload: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as any;
}

describe("AIScoringProvider", () => {
  let provider: AIScoringProvider;

  beforeEach(() => {
    // El constructor de Anthropic exige una API key (lee del entorno).
    process.env.ANTHROPIC_API_KEY = "test-key";
    provider = new AIScoringProvider(new HeuristicScoringProvider());
  });

  it("usa la respuesta del modelo y marca source = AI", async () => {
    const modelJson = JSON.stringify({
      scoreValue: 82,
      reasons: [{ rule: "subsidy_eligible", delta: 40, description: "Subsidio disponible" }],
    });
    (provider as any).client = {
      messages: { create: vi.fn().mockResolvedValue({ content: [{ type: "text", text: modelJson }] }) },
    };

    const result = await provider.score(makeLead());

    expect(result.source).toBe("AI");
    expect(result.scoreValue).toBe(82);
    expect(result.tier).toBe("HOT"); // recalculado desde el score
    expect(result.reasons[0]?.rule).toBe("subsidy_eligible");
  });

  it("clampea y recalcula el tier aunque el modelo se desvíe", async () => {
    const modelJson = JSON.stringify({ scoreValue: 999, tier: "COLD", reasons: [] });
    (provider as any).client = {
      messages: { create: vi.fn().mockResolvedValue({ content: [{ type: "text", text: modelJson }] }) },
    };

    const result = await provider.score(makeLead());

    expect(result.scoreValue).toBe(100); // clamp 0-100
    expect(result.tier).toBe("HOT"); // nunca se confía en el tier del modelo
  });

  it("cae al heurístico ante un error del modelo (resiliencia)", async () => {
    (provider as any).client = {
      messages: { create: vi.fn().mockRejectedValue(new Error("timeout")) },
    };

    const lead = makeLead({ subsidyEligible: true });
    const result = await provider.score(lead);

    // El heurístico da +40 por subsidio y NO marca source = AI.
    expect(result.scoreValue).toBe(40);
    expect(result.source).toBeUndefined();
    expect(result.reasons.find((r) => r.rule === "subsidy_eligible")).toBeTruthy();
  });
});
