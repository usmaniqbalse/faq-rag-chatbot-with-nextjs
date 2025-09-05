"use client";
import { useState } from "react";

export default function Composer({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex gap-2 p-4 border-t bg-white"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSend(value.trim());
        setValue("");
      }}
    >
      <textarea
        className="flex-1 resize-none rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
        placeholder="Ask a question about your PDF..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-4 text-white shadow hover:bg-blue-700"
      >
        Send
      </button>
    </form>
  );
}
