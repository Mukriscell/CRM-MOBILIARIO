"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface RecoveryCandidate {
  leadId: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  source: string;
  status: string;
  currentScoreTier: "HOT" | "WARM" | "COLD" | null;
  lastActivityAt: string;
  inactivityDays: number;
  threshold: "DAYS_30" | "DAYS_60" | "DAYS_90";
}

export interface RecoveryStats {
  candidates: number;
  pending: number;
  reactivated: number;
  lost: number;
  noResponse: number;
}

export function useRecoveryCandidates() {
  return useQuery({
    queryKey: ["recovery-candidates"],
    queryFn: () => apiFetch<{ data: RecoveryCandidate[] }>("/lead-recovery/candidates"),
  });
}

export function useRecoveryStats() {
  return useQuery({
    queryKey: ["recovery-stats"],
    queryFn: () => apiFetch<{ data: RecoveryStats }>("/lead-recovery/stats"),
  });
}

export function useReactivateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => apiFetch(`/lead-recovery/${leadId}/reactivate`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recovery-candidates"] });
      void qc.invalidateQueries({ queryKey: ["recovery-stats"] });
      void qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: Error) => {
      alert(`Error al reactivar: ${err.message}`);
    },
  });
}

export function useArchiveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => apiFetch(`/lead-recovery/${leadId}/archive`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recovery-candidates"] });
      void qc.invalidateQueries({ queryKey: ["recovery-stats"] });
      void qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: Error) => {
      alert(`Error al archivar: ${err.message}`);
    },
  });
}
