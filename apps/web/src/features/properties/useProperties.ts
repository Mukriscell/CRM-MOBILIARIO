"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface PropertyRow {
  id: string;
  internalCode: string;
  type: string;
  status: string;
  address: string | null;
  region: string | null;
  commune: string | null;
  priceAmount: number | null;
  priceCurrency: string;
  areaBuiltM2: number | null;
  areaTotalM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyPayload {
  internalCode: string;
  type: string;
  status?: string;
  address?: string;
  commune?: string;
  region?: string;
  priceAmount?: number;
  priceCurrency?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaBuiltM2?: number;
  description?: string;
}

interface PropertiesResponse {
  data: PropertyRow[];
}

export function useProperties(filters: { status?: string; type?: string; commune?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.commune) params.set("commune", filters.commune);

  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () => apiFetch<PropertiesResponse>(`/properties?${params.toString()}`),
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) =>
      apiFetch("/properties", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
