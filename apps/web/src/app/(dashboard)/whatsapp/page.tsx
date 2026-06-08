"use client";
import { useState, useRef, useEffect } from "react";
import {
  useConversations,
  useThread,
  useSendMessage,
  type ConversationRow,
} from "@/features/conversations/useConversations";

export default function InboxPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: convs, isLoading } = useConversations();
  const conversations = convs?.items ?? [];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">💬 Inbox WhatsApp</h1>
      <p className="mb-4 text-sm text-zinc-400">Conversaciones centralizadas y vinculadas a cada lead.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        {/* Lista: en móvil se oculta cuando hay una conversación abierta (maestro-detalle) */}
        <aside className={`rounded-xl border border-zinc-800 bg-zinc-900 ${activeId ? "hidden md:block" : ""}`}>
          {isLoading && <div className="p-4 text-sm text-zinc-500">Cargando…</div>}
          {!isLoading && conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-500">
              No hay conversaciones todavía. <br />
              Cuando entre un lead con teléfono, aquí aparecerá su chat con la autorespuesta enviada. 🎉
            </div>
          )}
          <ul className="divide-y divide-zinc-800">
            {conversations.map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onClick={() => setActiveId(c.id)}
              />
            ))}
          </ul>
        </aside>

        {/* Chat: en móvil solo se muestra cuando hay una conversación seleccionada */}
        <section className={`min-h-[60vh] rounded-xl border border-zinc-800 bg-zinc-900 ${activeId ? "" : "hidden md:block"}`}>
          {activeId ? (
            <Thread conversationId={activeId} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex h-full min-h-[60vh] items-center justify-center text-sm text-zinc-500">
              Selecciona una conversación para ver el historial y responder.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: ConversationRow;
  active: boolean;
  onClick: () => void;
}) {
  const title = conv.leadName ?? conv.waContactPhone;
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full px-4 py-3 text-left hover:bg-zinc-800 ${active ? "bg-zinc-800" : ""}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{title}</span>
          {conv.status === "OPEN" && (
            <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] text-emerald-300">
              abierta
            </span>
          )}
        </div>
        <div className="mt-1 truncate text-xs text-zinc-400">
          {conv.lastMessageDirection === "OUTBOUND" ? "Tú: " : ""}
          {conv.lastMessageBody ?? "Sin mensajes"}
        </div>
      </button>
    </li>
  );
}

function Thread({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { data } = useThread(conversationId);
  const send = useSendMessage(conversationId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages?.items ?? [];
  const conv = data?.conversation;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const body = text.trim();
    if (!body) return;
    send.mutate(body);
    setText("");
  };

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <header className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Volver a la lista"
          className="-ml-1 rounded p-1.5 text-xl leading-none text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
        >
          ←
        </button>
        <div>
          <div className="font-medium text-white">{conv?.leadName ?? conv?.waContactPhone}</div>
          <div className="text-xs text-zinc-500">{conv?.waContactPhone}</div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                m.direction === "OUTBOUND"
                  ? "bg-emerald-700 text-white"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              {m.body}
              <div className="mt-1 text-[10px] opacity-60">
                {m.sentByUserId === null && m.direction === "OUTBOUND" ? "automático · " : ""}
                {new Date(m.createdAt).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {m.direction === "OUTBOUND" && m.metadata?.deliveryStatus === "FAILED" && (
                <div className="mt-1 text-[10px] font-semibold text-red-300">
                  ⚠ No entregado por WhatsApp
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe una respuesta…"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
          />
          <button
            onClick={handleSend}
            disabled={send.isPending || !text.trim()}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
