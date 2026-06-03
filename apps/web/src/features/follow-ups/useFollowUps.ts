"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface FollowUpRow {
  id: string;
  tenantId: string;
  leadId: string;
  sequenceStep: number;
  channel: string;
  scheduledAt: string;
  executedAt: string | null;
  status: "PENDING" | "SENT" | "CANCELLED" | "FAILED";
  cancelReason: string | null;
  createdAt: string;
}

export interface FollowUpStats {
  pending: number;
  overdue: number;
  executed: number;
  compliancePct: number;
}

export type FollowUpFilter = "all" | "pending" | "executed" | "overdue" | "cancelled";

export function useFollowUps(filter: FollowUpFilter = "all") {
  return useQuery({
    queryKey: ["follow-ups", filter],
    queryFn: () => apiFetch<{ data: FollowUpRow[] }>(`/follow-ups?filter=${filter}`),
  });
}

export function useFollowUpStats() {
  return useQuery({
    queryKey: ["follow-up-stats"],
    queryFn: () => apiFetch<{ data: FollowUpStats }>("/follow-ups/stats"),
  });
}

export function useExecuteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/follow-ups/${id}/execute`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["follow-ups"] });
      void qc.invalidateQueries({ queryKey: ["follow-up-stats"] });
    },
  });
}

export function useCancelFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/follow-ups/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["follow-ups"] });
      void qc.invalidateQueries({ queryKey: ["follow-up-stats"] });
    },
  });
}
