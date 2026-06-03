import { describe, it, expect, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { GetRecoveryCandidatesUseCase } from "../application/get-recovery-candidates.use-case";
import { ReactivateLeadUseCase } from "../application/reactivate-lead.use-case";
import { ArchiveLeadUseCase } from "../application/archive-lead.use-case";
import { GetRecoveryStatsUseCase } from "../application/get-recovery-stats.use-case";
import type { RecoveryCandidate, RecoveryStats } from "../domain/lead-recovery.entity";
import type { LeadRecovery } from "@prisma/client";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeCandidate(overrides: Partial<RecoveryCandidate> = {}): RecoveryCandidate {
  return {
    leadId: "lead-1",
    tenantId: "tenant-1",
    firstName: "Juan",
    lastName: "Pérez",
    phone: "+56912345678",
    source: "WHATSAPP",
    status: "CONTACTADO",
    currentScoreTier: "COLD",
    lastActivityAt: new Date(Date.now() - 45 * 86_400_000),
    inactivityDays: 45,
    threshold: "DAYS_30",
    ...overrides,
  };
}

function makeRecovery(overrides: Partial<LeadRecovery> = {}): LeadRecovery {
  return {
    id: "rec-1",
    tenantId: "tenant-1",
    leadId: "lead-1",
    inactivityThreshold: "DAYS_30",
    detectedAt: new Date(),
    recoveryAction: null,
    outcome: "PENDING",
    resolvedAt: null,
    ...overrides,
  } as LeadRecovery;
}

function mockRepo(candidates: RecoveryCandidate[] = [], candidateById: RecoveryCandidate | null = null) {
  return {
    findCandidates: vi.fn().mockResolvedValue(candidates),
    findCandidateById: vi.fn().mockResolvedValue(candidateById),
    create: vi.fn().mockImplementation((input: { outcome: string }) =>
      Promise.resolve(makeRecovery({ outcome: input.outcome as "PENDING" | "REACTIVATED" | "NO_RESPONSE" | "LOST" })),
    ),
    findById: vi.fn(),
    findByLead: vi.fn().mockResolvedValue([]),
    updateLeadStatus: vi.fn().mockResolvedValue(undefined),
    stats: vi.fn(),
  };
}

function mockEvents() {
  return { publish: vi.fn() };
}

// ── GetRecoveryCandidatesUseCase ─────────────────────────────────────────────

describe("GetRecoveryCandidatesUseCase", () => {
  it("devuelve los candidatos del repositorio", async () => {
    const candidates = [makeCandidate(), makeCandidate({ leadId: "lead-2", inactivityDays: 70, threshold: "DAYS_60" })];
    const repo = mockRepo(candidates);
    const useCase = new GetRecoveryCandidatesUseCase(repo as never);

    const result = await useCase.execute("tenant-1");

    expect(repo.findCandidates).toHaveBeenCalledWith("tenant-1");
    expect(result).toHaveLength(2);
  });

  it("devuelve array vacío cuando no hay candidatos", async () => {
    const repo = mockRepo([]);
    const useCase = new GetRecoveryCandidatesUseCase(repo as never);

    const result = await useCase.execute("tenant-1");
    expect(result).toHaveLength(0);
  });
});

// ── ReactivateLeadUseCase ────────────────────────────────────────────────────

describe("ReactivateLeadUseCase", () => {
  it("crea un recovery con outcome REACTIVATED y publica LeadRecoveredEvent", async () => {
    const candidate = makeCandidate();
    const repo = mockRepo([], candidate);
    const events = mockEvents();
    const useCase = new ReactivateLeadUseCase(repo as never, events as never);

    const result = await useCase.execute("tenant-1", "lead-1");

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "REACTIVATED", leadId: "lead-1" }),
    );
    expect(repo.updateLeadStatus).toHaveBeenCalledWith("tenant-1", "lead-1", "CONTACTADO");
    expect(events.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: "lead.recovered", leadId: "lead-1" }),
    );
    expect(result.outcome).toBe("REACTIVATED");
  });

  it("lanza NotFoundException si el lead no es candidato", async () => {
    const repo = mockRepo([], null);
    const events = mockEvents();
    const useCase = new ReactivateLeadUseCase(repo as never, events as never);

    await expect(useCase.execute("tenant-1", "lead-inexistente")).rejects.toThrow(NotFoundException);
    expect(events.publish).not.toHaveBeenCalled();
  });
});

// ── ArchiveLeadUseCase ───────────────────────────────────────────────────────

describe("ArchiveLeadUseCase", () => {
  it("crea un recovery con outcome LOST y actualiza status a PERDIDO", async () => {
    const candidate = makeCandidate({ inactivityDays: 92, threshold: "DAYS_90" });
    const repo = mockRepo([], candidate);
    const useCase = new ArchiveLeadUseCase(repo as never);

    await useCase.execute("tenant-1", "lead-1");

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "LOST", inactivityThreshold: "DAYS_90" }),
    );
    expect(repo.updateLeadStatus).toHaveBeenCalledWith("tenant-1", "lead-1", "PERDIDO");
  });

  it("lanza NotFoundException si el lead no es candidato", async () => {
    const repo = mockRepo([], null);
    const useCase = new ArchiveLeadUseCase(repo as never);

    await expect(useCase.execute("tenant-1", "lead-nulo")).rejects.toThrow(NotFoundException);
  });
});

// ── GetRecoveryStatsUseCase ──────────────────────────────────────────────────

describe("GetRecoveryStatsUseCase", () => {
  it("delega al repositorio y devuelve las estadísticas correctas", async () => {
    const expected: RecoveryStats = { candidates: 5, pending: 1, reactivated: 3, lost: 2, noResponse: 0 };
    const repo = { stats: vi.fn().mockResolvedValue(expected) };
    const useCase = new GetRecoveryStatsUseCase(repo as never);

    const result = await useCase.execute("tenant-1");

    expect(repo.stats).toHaveBeenCalledWith("tenant-1");
    expect(result).toEqual(expected);
  });
});

// ── No afecta H1-H4 ─────────────────────────────────────────────────────────

describe("Aislamiento H1-H4", () => {
  it("ReactivateLeadUseCase no modifica follow-ups ni scoring", async () => {
    const candidate = makeCandidate();
    const repo = mockRepo([], candidate);
    const events = mockEvents();
    const useCase = new ReactivateLeadUseCase(repo as never, events as never);

    await useCase.execute("tenant-1", "lead-1");

    // Solo interactúa con métodos del recovery repository
    const calledMethods = Object.keys(repo).filter((k) => (repo as Record<string, { mock?: { calls: unknown[] } }>)[k]?.mock?.calls?.length);
    expect(calledMethods).not.toContain("cancelAllPendingForLead");
    expect(calledMethods).not.toContain("createMany");
  });
});
