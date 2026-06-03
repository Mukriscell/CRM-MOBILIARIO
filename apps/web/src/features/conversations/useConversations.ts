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
}

interface ThreadResponse {
  data: {
    conversation: ConversationRow;
    messages: MessageRow[];
  };
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch<{ data: ConversationRow[] }>("/conversations"),
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
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-stats"] });
    },
  });
}
