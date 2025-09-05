"use client";
import { Message } from "@/lib/types";

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2 shadow
              ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-white border"
              }
            `}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        </div>
      ))}
      {messages.length === 0 && (
        <div className="text-center text-neutral-500 mt-24">
          Start by uploading a PDF and asking a question.
        </div>
      )}
    </div>
  );
}
