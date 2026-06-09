import { describe, it, expect, beforeEach } from "vitest";
import { HeuristicScoringProvider } from "../infrastructure/heuristic-scoring.provider";
import { classifyTier } from "../domain/lead-score.entity";

// Minimal Lead stub — only fields the heuristic rules inspect
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

describe("HeuristicScoringProvider", () => {
  let provider: HeuristicScoringProvider;

  beforeEach(() => {
    provider = new HeuristicScoringProvider();
  });

  // ── Clasificación de tier ─────────────────────────────────────────────────

  it("classifyTier: 80 → HOT", () => expect(classifyTier(80)).toBe("HOT"));
  it("classifyTier: 100 → HOT", () => expect(classifyTier(100)).toBe("HOT"));
  it("classifyTier: 79 → WARM", () => expect(classifyTier(79)).toBe("WARM"));
  it("classifyTier: 50 → WARM", () => expect(classifyTier(50)).toBe("WARM"));
  it("classifyTier: 49 → COLD", () => expect(classifyTier(49)).toBe("COLD"));
  it("classifyTier: 0 → COLD", () => expect(classifyTier(0)).toBe("COLD"));

  // ── Sin datos → COLD con 0 ────────────────────────────────────────────────

  it("lead vacío → score 0 COLD sin reasons", async () => {
    const result = await provider.score(makeLead());
    expect(result.scoreValue).toBe(0);
    expect(result.tier).toBe("COLD");
    expect(result.reasons).toHaveLength(0);
  });

  // ── Reglas individuales ───────────────────────────────────────────────────

  it("+40 cuando subsidyEligible = true → score 40 COLD", async () => {
    const result = await provider.score(makeLead({ subsidyEligible: true }));
    expect(result.scoreValue).toBe(40);
    expect(result.tier).toBe("COLD");
    expect(result.reasons.find((r) => r.rule === "subsidy_eligible")?.delta).toBe(40);
  });

  it("+15 crédito PRE_APPROVED → score 15", async () => {
    const result = await provider.score(makeLead({ creditStatus: "PRE_APPROVED" }));
    expect(result.scoreValue).toBe(15);
  });

  it("+15 crédito APPROVED → score 15", async () => {
    const result = await provider.score(makeLead({ creditStatus: "APPROVED" }));
    expect(result.scoreValue).toBe(15);
  });

  it("+30 pie 25% (>= 20%) → score 30", async () => {
    const result = await provider.score(
      makeLead({ downPayment: 25_000_000, budgetAmount: 100_000_000 }),
    );
    expect(result.scoreValue).toBe(30);
    expect(result.reasons.find((r) => r.rule === "down_payment_high")).toBeTruthy();
  });

  it("-20 pie 3% (< 5%) → score 0 (clamped from -20)", async () => {
    const result = await provider.score(
      makeLead({ downPayment: 3_000_000, budgetAmount: 100_000_000 }),
    );
    expect(result.scoreValue).toBe(0);
    expect(result.reasons.find((r) => r.rule === "down_payment_low")?.delta).toBe(-20);
  });

  it("+20 dividendo <= 25% ingreso", async () => {
    const result = await provider.score(
      makeLead({ rawPayload: { monthlyIncome: 2_000_000, estimatedMortgage: 400_000 } }),
    );
    expect(result.scoreValue).toBe(20);
    expect(result.reasons.find((r) => r.rule === "dividend_low")).toBeTruthy();
  });

  it("-30 dividendo > 45% ingreso → score 0 (clamped)", async () => {
    const result = await provider.score(
      makeLead({ rawPayload: { monthlyIncome: 1_000_000, estimatedMortgage: 500_000 } }),
    );
    expect(result.scoreValue).toBe(0);
    expect(result.reasons.find((r) => r.rule === "dividend_high")?.delta).toBe(-30);
  });

  it("+10 ingreso familiar alto (>= 3M CLP)", async () => {
    const result = await provider.score(
      makeLead({ rawPayload: { monthlyIncome: 3_000_000 } }),
    );
    expect(result.scoreValue).toBe(10);
    expect(result.reasons.find((r) => r.rule === "high_income")).toBeTruthy();
  });

  // ── Combinaciones → clasificación correcta ────────────────────────────────

  it("subsidy + credit = 55 → WARM", async () => {
    const result = await provider.score(
      makeLead({ subsidyEligible: true, creditStatus: "PRE_APPROVED" }),
    );
    expect(result.scoreValue).toBe(55);
    expect(result.tier).toBe("WARM");
  });

  it("subsidy + credit + high pie = 85 → HOT", async () => {
    const result = await provider.score(
      makeLead({
        subsidyEligible: true,
        creditStatus: "PRE_APPROVED",
        downPayment: 25_000_000,
        budgetAmount: 100_000_000,
      }),
    );
    expect(result.scoreValue).toBe(85);
    expect(result.tier).toBe("HOT");
  });

  it("score máximo clamped a 100", async () => {
    const result = await provider.score(
      makeLead({
        subsidyEligible: true,
        creditStatus: "APPROVED",
        downPayment: 30_000_000,
        budgetAmount: 100_000_000,
        rawPayload: { monthlyIncome: 5_000_000, estimatedMortgage: 800_000 },
      }),
    );
    // 40+15+30+20+10 = 115 → clamped to 100
    expect(result.scoreValue).toBe(100);
    expect(result.tier).toBe("HOT");
  });

  // ── Señales de intención (heurístico mejorado) ────────────────────────────

  it("+15 urgencia HIGH", async () => {
    const result = await provider.score(makeLead({ urgency: "HIGH" }));
    expect(result.scoreValue).toBe(15);
    expect(result.reasons.find((r) => r.rule === "urgency_high")?.delta).toBe(15);
  });

  it("-5 urgencia LOW (clamped a 0 sin otras señales)", async () => {
    const result = await provider.score(makeLead({ urgency: "LOW" }));
    expect(result.scoreValue).toBe(0);
    expect(result.reasons.find((r) => r.rule === "urgency_low")?.delta).toBe(-5);
  });

  it("+12 fuente REFERIDO (alta intención)", async () => {
    const result = await provider.score(makeLead({ source: "REFERIDO" }));
    expect(result.scoreValue).toBe(12);
    expect(result.reasons.find((r) => r.rule === "source_intent")?.delta).toBe(12);
  });

  it("fuente WHATSAPP no aporta (baseline neutro)", async () => {
    const result = await provider.score(makeLead({ source: "WHATSAPP" }));
    expect(result.scoreValue).toBe(0);
    expect(result.reasons.find((r) => r.rule === "source_intent")).toBeUndefined();
  });

  it("+10 interesado en una propiedad concreta", async () => {
    const result = await provider.score(makeLead({ interestedPropertyId: "prop-1" }));
    expect(result.scoreValue).toBe(10);
    expect(result.reasons.find((r) => r.rule === "interested_property")).toBeTruthy();
  });

  it("+5 lead enganchado (firstResponseAt presente)", async () => {
    const result = await provider.score(makeLead({ firstResponseAt: new Date() }));
    expect(result.scoreValue).toBe(5);
    expect(result.reasons.find((r) => r.rule === "engaged")).toBeTruthy();
  });

  it("combina señales financieras + intención", async () => {
    // subsidio(40) + referido(12) + urgencia alta(15) + propiedad(10) = 77 → WARM
    const result = await provider.score(
      makeLead({
        subsidyEligible: true,
        source: "REFERIDO",
        urgency: "HIGH",
        interestedPropertyId: "prop-1",
      }),
    );
    expect(result.scoreValue).toBe(77);
    expect(result.tier).toBe("WARM");
  });

  // ── Idempotencia ──────────────────────────────────────────────────────────

  it("resultado idempotente: mismos datos → mismo score", async () => {
    const lead = makeLead({ subsidyEligible: true, creditStatus: "PRE_APPROVED" });
    const r1 = await provider.score(lead);
    const r2 = await provider.score(lead);
    expect(r1.scoreValue).toBe(r2.scoreValue);
    expect(r1.tier).toBe(r2.tier);
    expect(r1.reasons.map((r) => r.rule)).toEqual(r2.reasons.map((r) => r.rule));
  });
});
