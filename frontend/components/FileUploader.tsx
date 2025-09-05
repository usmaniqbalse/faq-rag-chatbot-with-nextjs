"use client";

import { useState } from "react";

export default function FileUploader() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || "Upload failed");
      }
      const data = await res.json();
      setMsg(`✅ Ingested "${data.file_name}" with ${data.chunks} chunks`);
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white cursor-pointer">
        <span>📄 Upload PDF</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFile}
          disabled={busy}
        />
      </label>
      {busy && <span className="text-sm text-neutral-500">Processing…</span>}
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
