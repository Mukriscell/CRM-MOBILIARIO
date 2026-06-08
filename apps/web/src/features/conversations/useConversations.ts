"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/lib/api-client";

export interface ConversationRow {
  id: string;
  waContactPhone: string;
  leadId: string | null;
  leadName: string | null;
  status: string;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  lastMessageDirection: "INBOUND" | "OUTBOUND" | null;
}

export interface MessageRow {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string | null;
  sentByUserId: string | null;
  createdAt: string;
  metadata: { deliveryStatus?: "SENT" | "FAILED"; error?: string | null } | null;
}

interface ConversationListResponse {
  items: ConversationRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ThreadResponse {
  conversation: ConversationRow;
  messages: {
    items: MessageRow[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch<ConversationListResponse>("/conversations"),
  });
}

export function useThread(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => apiFetch<ThreadResponse>(`/conversations/${conversationId}`),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
      void qc.invalidateQueries({ queryKey: ["leads"] });
      void qc.invalidateQueries({ queryKey: ["lead-stats"] });
    },
    onError: (err: Error) => {
      alert(`No se pudo enviar el mensaje: ${err.message}`);
    },
  });
}
