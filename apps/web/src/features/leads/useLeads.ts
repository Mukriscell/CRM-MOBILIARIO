"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface LeadRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  source: string;
  status: string;
  scoreTier: string | null;
  assignedUserId: string | null;
  minutesWaiting: number | null;
  lastActivityAt: string;
}

interface LeadsResponse {
  data: LeadRow[];
  pagination: { nextCursor: string | null; hasMore: boolean; limit: number };
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leads"] });
      void qc.invalidateQueries({ queryKey: ["lead-stats"] });
    },
  });
}

export function useLeads(filters: { status?: string; unresponded?: boolean } = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.unresponded) params.set("unresponded", "true");

  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () => apiFetch<LeadsResponse>(`/leads?${params.toString()}`),
  });
}
