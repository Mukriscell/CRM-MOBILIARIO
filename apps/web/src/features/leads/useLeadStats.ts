"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface LeadStats {
  total: number;
  responded: number;
  unresponded: number;
  avgTtfrSeconds: number | null;
}

export function useLeadStats() {
  return useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => apiFetch<{ data: LeadStats }>("/leads/stats"),
  });
}

/** Formatea segundos a un texto legible (TTFR): "3 min", "1 h 5 min", "45 s". */
export function formatTtfr(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}
