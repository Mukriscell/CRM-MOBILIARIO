import { Lead, LeadSource } from "@prisma/client";

export const LEAD_REPOSITORY = Symbol("LEAD_REPOSITORY");

export interface CreateLeadData {
  tenantId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  budgetAmount?: number | null;
  budgetCurrency?: "UF" | "CLP";
  interestedPropertyId?: string | null;
  rawPayload?: unknown;
}

export interface LeadListFilters {
  status?: string;
  source?: string;
  assignedUserId?: string;
  unresponded?: boolean; // leads sin first_response_at (bandeja "sin respuesta")
}

export interface LeadListResult {
  items: Lead[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ILeadRepository {
  create(data: CreateLeadData): Promise<Lead>;
  /** Deduplicación: lead activo del tenant con el mismo phone o email (FASE 9 §9). */
  findActiveByContact(tenantId: string, phone?: string | null, email?: string | null): Promise<Lead | null>;
  findById(tenantId: string, id: string): Promise<Lead | null>;
  listByCursor(tenantId: string, filters: LeadListFilters, cursor: string | null, limit: number): Promise<LeadListResult>;
  /** Registra una nueva consulta sobre un lead existente (merge en dedup). */
  touchActivity(tenantId: string, leadId: string, occurredAt: Date): Promise<void>;
  assign(tenantId: string, leadId: string, userId: string, by: "SYSTEM" | "MANUAL", reason?: unknown): Promise<Lead>;
}
