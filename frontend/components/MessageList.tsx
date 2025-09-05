"use client";
import { Message } from "@/lib/types";

function formatTime(ts: number) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessageList({
  messages,
  busy,
}: {
  messages: Message[];
  busy?: boolean;
}) {
  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      {messages.length === 0 && (
        <div className="m-auto text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg" />
          <p className="text-lg font-semibold">Ask about your PDF</p>
          <p className="muted">
            Upload a document, then type a question below.
          </p>
        </div>
      )}

      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="max-w-[80%]">
            <div
              className={m.role === "user" ? "bubble-user" : "bubble-assistant"}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
            <div
              className={`mt-1 text-[11px] ${
                m.role === "user" ? "text-right" : ""
              } muted`}
            >
              {formatTime(m.createdAt)}
            </div>
          </div>
        </div>
      ))}

      {busy && (
        <div className="flex justify-start">
          <div className="bubble-assistant">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Thinking…
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
