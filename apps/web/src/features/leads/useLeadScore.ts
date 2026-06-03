"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface ScoreReason {
  rule: string;
  delta: number;
  description: string;
}

export interface LeadScoreEntry {
  id: string;
  scoreValue: number;
  tier: string;
  reasons: ScoreReason[] | null;
  source: string;
  scoredAt: string;
}

export interface LeadScoreData {
  latest: LeadScoreEntry | null;
  history: LeadScoreEntry[];
}

export function useLeadScore(leadId: string) {
  return useQuery({
    queryKey: ["lead-score", leadId],
    queryFn: () => apiFetch<{ data: LeadScoreData }>(`/leads/${leadId}/score`),
    enabled: Boolean(leadId),
  });
}

export function useRecalculateScore(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/leads/${leadId}/recalculate`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["lead-score", leadId] });
      void qc.invalidateQueries({ queryKey: ["leads"] });
      void qc.invalidateQueries({ queryKey: ["lead-stats"] });
    },
  });
}
