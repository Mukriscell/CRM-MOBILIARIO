"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface VisitRow {
  id: string;
  leadId: string;
  propertyId: string;
  userId: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  createdAt: string;
  leadName: string | null;
  leadPhone: string | null;
  propertyCode: string | null;
  propertyAddress: string | null;
  userName: string | null;
}

export interface ScheduleVisitPayload {
  leadId: string;
  propertyId: string;
  scheduledAt: string; // ISO
  userId?: string;
  notes?: string;
}

interface VisitsResponse {
  data: VisitRow[];
}

export function useVisits(filters: { status?: string; userId?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.userId) params.set("userId", filters.userId);

  return useQuery({
    queryKey: ["visits", filters],
    queryFn: () => apiFetch<VisitsResponse>(`/visits?${params.toString()}`),
  });
}

export function useScheduleVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScheduleVisitPayload) =>
      apiFetch("/visits", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["visits"] });
      // La visita mueve el lead a VISITA_AGENDADA → refrescar pipeline/leads.
      void qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateVisitStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/visits/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["visits"] });
    },
    onError: (err: Error) => {
      alert(`No se pudo actualizar la visita: ${err.message}`);
    },
  });
}
