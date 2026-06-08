import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScheduleFollowUpUseCase } from "../application/schedule-follow-up.use-case";
import { CancelFollowUpUseCase } from "../application/cancel-follow-up.use-case";
import { ExecuteFollowUpUseCase } from "../application/execute-follow-up.use-case";
import { ListFollowUpsUseCase } from "../application/list-follow-ups.use-case";
import { GetFollowUpStatsUseCase } from "../application/get-follow-up-stats.use-case";
import { CADENCE_DAYS } from "../domain/follow-up.entity";
import type { LeadFollowUp } from "@prisma/client";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFollowUp(overrides: Partial<LeadFollowUp> = {}): LeadFollowUp {
  return {
    id: "fu-1",
    tenantId: "tenant-1",
    leadId: "lead-1",
    sequenceStep: 1,
    channel: "WHATSAPP",
    scheduledAt: new Date(Date.now() + 86_400_000),
    executedAt: null,
    status: "PENDING",
    cancelReason: null,
    createdAt: new Date(),
    ...overrides,
  } as LeadFollowUp;
}

// ── ScheduleFollowUpUseCase ──────────────────────────────────────────────────

describe("ScheduleFollowUpUseCase", () => {
  let repo: ReturnType<typeof mockRepo>;
  let queue: ReturnType<typeof mockQueue>;
  let useCase: ScheduleFollowUpUseCase;

  function mockRepo() {
    const created: LeadFollowUp[] = CADENCE_DAYS.map((d) =>
      makeFollowUp({ id: `fu-${d}`, sequenceStep: d }),
    );
    return {
      createMany: vi.fn().mockResolvedValue(created),
      findById: vi.fn(),
      findByLead: vi.fn().mockResolvedValue([]),
      findPendingForTenant: vi.fn().mockResolvedValue([]),
      findAllForTenant: vi.fn().mockResolvedValue([]),
      cancelAllPendingForLead: vi.fn().mockResolvedValue(0),
      markExecuted: vi.fn(),
      markFailed: vi.fn(),
      stats: vi.fn(),
    };
  }

  function mockQueue() {
    return {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
      getJob: vi.fn().mockResolvedValue(null),
    };
  }

  beforeEach(() => {
    repo = mockRepo();
    queue = mockQueue();
    useCase = new ScheduleFollowUpUseCase(repo as never, queue as never);
  });

  it("crea 4 follow-ups (días 1, 3, 7, 14)", async () => {
    await useCase.execute("tenant-1", "lead-1");
    expect(repo.createMany).toHaveBeenCalledOnce();
    const inputs = repo.createMany.mock.calls[0][0] as { sequenceStep: number }[];
    expect(inputs.map((i) => i.sequenceStep)).toEqual([1, 3, 7, 14]);
  });

  it("encola 4 jobs en BullMQ con jobId = followUpId", async () => {
    await useCase.execute("tenant-1", "lead-1");
    expect(queue.add).toHaveBeenCalledTimes(4);
    const calls = queue.add.mock.calls as [string, { followUpId: string }, { jobId: string }][];
    for (const [, data, opts] of calls) {
      expect(opts.jobId).toBe(data.followUpId);
    }
  });

  it("los jobs se crean con delay > 0", async () => {
    await useCase.execute("tenant-1", "lead-1");
    const calls = queue.add.mock.calls as [string, unknown, { delay: number }][];
    for (const [, , opts] of calls) {
      expect(opts.delay).toBeGreaterThan(0);
    }
  });

  it("los jobs tienen 3 intentos configurados", async () => {
    await useCase.execute("tenant-1", "lead-1");
    const [, , opts] = queue.add.mock.calls[0] as [string, unknown, { attempts: number }];
    expect(opts.attempts).toBe(3);
  });
});

// ── CancelFollowUpUseCase ────────────────────────────────────────────────────

describe("CancelFollowUpUseCase", () => {
  let repo: ReturnType<typeof mockRepoForCancel>;
  let queue: ReturnType<typeof mockQueue>;
  let useCase: CancelFollowUpUseCase;

  function mockRepoForCancel(followUps: LeadFollowUp[] = []) {
    return {
      createMany: vi.fn(),
      findById: vi.fn().mockImplementation((_tenantId: string, id: string) =>
        Promise.resolve(followUps.find((f) => f.id === id) ?? null),
      ),
      findByLead: vi.fn().mockResolvedValue(followUps),
      findPendingForTenant: vi.fn().mockResolvedValue([]),
      findAllForTenant: vi.fn().mockResolvedValue([]),
      cancelAllPendingForLead: vi.fn().mockResolvedValue(followUps.filter((f) => f.status === "PENDING").length),
      markExecuted: vi.fn(),
      markCancelled: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockImplementation((_tenantId: string, id: string) =>
        Promise.resolve(makeFollowUp({ id, status: "FAILED" })),
      ),
      stats: vi.fn(),
    };
  }

  function mockQueue() {
    return {
      add: vi.fn(),
      getJob: vi.fn().mockResolvedValue(null),
    };
  }

  it("cancela un follow-up específico por ID", async () => {
    const fu = makeFollowUp({ id: "fu-1", status: "PENDING" });
    repo = mockRepoForCancel([fu]);
    queue = mockQueue();
    useCase = new CancelFollowUpUseCase(repo as never, queue as never);

    await useCase.executeOne("tenant-1", "fu-1");
    expect(repo.markCancelled).toHaveBeenCalledWith("tenant-1", "fu-1", expect.any(String));
  });

  it("no hace nada si el follow-up ya está SENT", async () => {
    const fu = makeFollowUp({ id: "fu-1", status: "SENT" });
    repo = mockRepoForCancel([fu]);
    queue = mockQueue();
    useCase = new CancelFollowUpUseCase(repo as never, queue as never);

    await useCase.executeOne("tenant-1", "fu-1");
    expect(repo.markCancelled).not.toHaveBeenCalled();
  });

  it("cancela todos los PENDING de un lead", async () => {
    const fus = CADENCE_DAYS.map((d) => makeFollowUp({ id: `fu-${d}`, sequenceStep: d }));
    repo = mockRepoForCancel(fus);
    queue = mockQueue();
    useCase = new CancelFollowUpUseCase(repo as never, queue as never);

    await useCase.executeAllForLead("tenant-1", "lead-1", "lead respondió");
    expect(repo.cancelAllPendingForLead).toHaveBeenCalledWith("tenant-1", "lead-1", "lead respondió");
  });
});

// ── ExecuteFollowUpUseCase ───────────────────────────────────────────────────

describe("ExecuteFollowUpUseCase", () => {
  it("marca el follow-up como SENT", async () => {
    const fu = makeFollowUp({ id: "fu-1", status: "PENDING" });
    const executed = makeFollowUp({ id: "fu-1", status: "SENT", executedAt: new Date() });
    const repo = {
      findById: vi.fn().mockResolvedValue(fu),
      markExecuted: vi.fn().mockResolvedValue(executed),
    };
    const useCase = new ExecuteFollowUpUseCase(repo as never);

    const result = await useCase.execute("tenant-1", "fu-1");
    expect(repo.markExecuted).toHaveBeenCalledWith("tenant-1", "fu-1");
    expect(result.status).toBe("SENT");
  });

  it("no re-ejecuta si ya está SENT (idempotente)", async () => {
    const fu = makeFollowUp({ id: "fu-1", status: "SENT", executedAt: new Date() });
    const repo = {
      findById: vi.fn().mockResolvedValue(fu),
      markExecuted: vi.fn(),
    };
    const useCase = new ExecuteFollowUpUseCase(repo as never);

    await useCase.execute("tenant-1", "fu-1");
    expect(repo.markExecuted).not.toHaveBeenCalled();
  });

  it("lanza NotFoundException si el ID no existe", async () => {
    const repo = { findById: vi.fn().mockResolvedValue(null) };
    const useCase = new ExecuteFollowUpUseCase(repo as never);
    await expect(useCase.execute("tenant-1", "inexistente")).rejects.toThrow();
  });
});

// ── ListFollowUpsUseCase ─────────────────────────────────────────────────────

describe("ListFollowUpsUseCase", () => {
  const now = new Date();
  const future = new Date(now.getTime() + 86_400_000);
  const past = new Date(now.getTime() - 86_400_000);

  const fus: LeadFollowUp[] = [
    makeFollowUp({ id: "a", status: "PENDING", scheduledAt: future }),
    makeFollowUp({ id: "b", status: "PENDING", scheduledAt: past }),
    makeFollowUp({ id: "c", status: "SENT" }),
    makeFollowUp({ id: "d", status: "CANCELLED" }),
  ];

  function makeUseCase() {
    const repo = { findAllForTenant: vi.fn().mockResolvedValue(fus) };
    return new ListFollowUpsUseCase(repo as never);
  }

  it("filter=pending devuelve solo PENDING futuros", async () => {
    const result = await makeUseCase().execute("tenant-1", "pending");
    expect(result.every((f) => f.status === "PENDING")).toBe(true);
    expect(result.every((f) => new Date(f.scheduledAt) > now)).toBe(true);
  });

  it("filter=overdue devuelve PENDING vencidos", async () => {
    const result = await makeUseCase().execute("tenant-1", "overdue");
    expect(result.every((f) => f.status === "PENDING")).toBe(true);
    expect(result.every((f) => new Date(f.scheduledAt) <= now)).toBe(true);
  });

  it("filter=executed devuelve solo SENT", async () => {
    const result = await makeUseCase().execute("tenant-1", "executed");
    expect(result.every((f) => f.status === "SENT")).toBe(true);
  });
});

// ── GetFollowUpStatsUseCase ──────────────────────────────────────────────────

describe("GetFollowUpStatsUseCase", () => {
  it("delega al repositorio y devuelve estadísticas", async () => {
    const expected = { pending: 3, overdue: 1, executed: 5, compliancePct: 83 };
    const repo = { stats: vi.fn().mockResolvedValue(expected) };
    const useCase = new GetFollowUpStatsUseCase(repo as never);

    const result = await useCase.execute("tenant-1");
    expect(result).toEqual(expected);
    expect(repo.stats).toHaveBeenCalledWith("tenant-1");
  });
});
