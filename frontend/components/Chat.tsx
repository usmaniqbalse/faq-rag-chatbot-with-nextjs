"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Message, AskResponse } from "@/lib/types";
import { loadThread, saveThread, clearThread } from "@/lib/storage";
import MessageList from "./MessageList";
import Composer from "./Composer";
import FileUploader from "./FileUploader";

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadThread());
  }, []);
  useEffect(() => {
    saveThread(messages);
  }, [messages]);
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    const user: Message = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, user]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = (await res.json()) as AskResponse;
      const assistant: Message = {
        id: uid(),
        role: "assistant",
        content: data.answer || "No answer.",
        createdAt: Date.now(),
      };
      setMessages((m) => [...m, assistant]);
    } catch (e: any) {
      const assistant: Message = {
        id: uid(),
        role: "assistant",
        content: `Error: ${e?.message || "Failed to ask."}`,
        createdAt: Date.now(),
      };
      setMessages((m) => [...m, assistant]);
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-4xl flex-col">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="font-semibold">RAG Chat</div>
        <div className="flex items-center gap-3">
          <FileUploader />
          <button
            onClick={() => {
              clearThread();
              setMessages([]);
            }}
            className="rounded-xl border bg-white px-3 py-2 hover:bg-neutral-50"
          >
            Clear chat
          </button>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      <Composer onSend={send} />
    </div>
  );
}
