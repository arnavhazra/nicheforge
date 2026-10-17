"use client";

import { useEffect, useState } from "react";
import type { RoiDocument } from "@/lib/fulfillment";
import { usd } from "@/lib/http";
import { useLive } from "./live";

type Artifact = {
  id: string;
  filename: string;
  title: string;
  description: string;
  document: unknown;
};

type Pack = {
  compiledAt: string;
  artifacts: Artifact[];
};

export function FulfillPillar() {
  const live = useLive();
  const [pack, setPack] = useState<Pack | null>(null);
  const [active, setActive] = useState("voice");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPack(null);
  }, [live.business, live.city, live.state, live.niche.id]);

  const body = {
    nicheId: live.niche.id,
    business: live.business,
    city: live.city,
    state: live.state,
  };

  async function compile() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/fulfill/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Compile failed");
      setPack(data as Pack);
      setActive("roi");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compile failed");
    } finally {
      setBusy(false);
    }
  }

  async function downloadZip() {
    const response = await fetch("/api/fulfill/compile?format=zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setError("Could not build the zip");
      return;
    }
    const blob = await response.blob();
    const match = (response.headers.get("Content-Disposition") || "").match(/filename="([^"]+)"/);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = match?.[1] || "nicheforge-pack.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selected = pack?.artifacts.find((item) => item.id === active) ?? pack?.artifacts[0];
  const roi = pack?.artifacts.find((item) => item.id === "roi")?.document as RoiDocument | undefined;
  const json = selected ? JSON.stringify(selected.document, null, 2) : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Don&apos;t drown in delivery</p>
          <h2 className="font-serif text-3xl text-gold-2">{live.business}</h2>
          <p className="text-sm text-dim">
            {live.niche.vertical} · {live.cityLine} · {live.niche.economics}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void compile()}
          disabled={busy}
          className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
        >
          {busy ? "Compiling…" : "Compile Client Fulfillment Pack (/api/fulfill/compile)"}
        </button>
      </div>
      <p className="text-xs text-dim">POST /api/fulfill/compile · voice agent, n8n workflow, GHL snapshot, ROI calculator.</p>
      {error && <p className="text-sm text-coral">{error}</p>}

      {!pack && (
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            ["Retell / Vapi voice agent", "Prompt, guardrails, extraction schema, tools."],
            ["n8n workflow", "Missed call, idempotency, GHL upsert, SMS, calendar."],
            ["GHL snapshot", "Stages, tags, custom fields, trigger links, cent-budget cap."],
            ["ROI calculator", "Under 18 minutes to deliver. $14.20 COGS. 99.1% margin."],
          ].map(([title, detail]) => (
            <li key={title} className="rounded-3xl border border-dashed border-line px-4 py-4">
              <p className="text-sm">{title}</p>
              <p className="mt-1 text-xs text-dim">{detail}</p>
            </li>
          ))}
        </ul>
      )}

      {roi && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Agency delivery" value={`${roi.delivery.minutes} min`} note={`Ceiling ${roi.delivery.ceilingMinutes} min`} />
          <Metric label="Monthly COGS" value={usd(roi.monthly.tokenAndTelephonyCogsUsd, 2)} note="Tokens + telephony" />
          <Metric label="Client retainer" value={usd(roi.monthly.clientRetainerUsd)} note="Per month" />
          <Metric label="Gross margin" value={`${roi.monthly.grossMarginPct}%`} note={roi.monthly.formula} />
        </div>
      )}

      {roi && (
        <ol className="grid gap-2 md:grid-cols-4">
          {roi.delivery.steps.map((step) => (
            <li key={step.name} className="rounded-2xl border border-line px-3 py-3 text-xs leading-relaxed">
              <span className="font-mono text-gold">{step.minutes} min</span>
              <span className="mt-1 block text-mist">{step.name}</span>
            </li>
          ))}
        </ol>
      )}

      {pack && selected && (
        <article className="overflow-hidden rounded-3xl border border-line">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3">
            {pack.artifacts.map((artifact) => (
              <button
                key={artifact.id}
                type="button"
                onClick={() => setActive(artifact.id)}
                className={`rounded-full px-3 py-1 text-xs ${active === artifact.id ? "bg-gold text-ink" : "border border-line"}`}
              >
                {artifact.title}
              </button>
            ))}
            <span className="ml-auto flex gap-2">
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs"
                onClick={() => {
                  void navigator.clipboard.writeText(json).then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1200);
                  });
                }}
              >
                {copied ? "Copied" : "Copy JSON"}
              </button>
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs"
                onClick={() => downloadBlob(selected.filename, json)}
              >
                Download file
              </button>
              <button type="button" className="rounded-full bg-gold px-3 py-1 text-xs text-ink" onClick={() => void downloadZip()}>
                Download bundle
              </button>
            </span>
          </div>
          <p className="px-4 pt-3 text-xs text-dim">
            {selected.filename} · {selected.description} · compiled {new Date(pack.compiledAt).toLocaleString()}
          </p>
          <pre className="max-h-[420px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-gold-2">{json}</pre>
        </article>
      )}
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-3xl border border-line bg-panel/80 p-4">
      <p className="text-[11px] uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-1 font-serif text-3xl text-gold-2">{value}</p>
      <p className="text-xs text-dim">{note}</p>
    </article>
  );
}

function downloadBlob(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
