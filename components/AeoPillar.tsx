"use client";

import { useEffect, useState } from "react";
import type { AeoReport } from "@/lib/aeo";
import { fill } from "@/lib/http";
import { useLive } from "./live";

export function AeoPillar() {
  const live = useLive();
  const [report, setReport] = useState<AeoReport | null>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setScanning(true);
      setError("");
      const started = performance.now();
      fetch("/api/demo/aeo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicheId: live.niche.id,
          business: live.business,
          cityLine: live.cityLine,
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Scan failed");
          const wait = Math.max(0, 650 - (performance.now() - started));
          await new Promise((resolve) => window.setTimeout(resolve, wait));
          if (!controller.signal.aborted) setReport(data as AeoReport);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setError(cause instanceof Error ? cause.message : "Scan failed");
        })
        .finally(() => {
          if (!controller.signal.aborted) setScanning(false);
        });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [live.niche.id, live.business, live.cityLine]);

  const json = report ? JSON.stringify(report.jsonLd, null, 2) : "";
  const queryPreview = fill(live.niche.queryTemplate, { city: live.city, business: live.business });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-dim">High-intent query</p>
        <p className="mt-1 font-serif text-3xl text-gold-2">“{report?.query ?? queryPreview}”</p>
        <p className="mt-1 text-sm text-dim">
          {scanning ? "Asking ChatGPT, Perplexity, and Google AI Overviews…" : `${live.business} · ${live.cityLine}`}
        </p>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}

      <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
        <article className="flex flex-col items-center justify-center rounded-3xl border border-line bg-panel/80 p-4">
          <ScoreRing score={report?.citationScore ?? 0} />
          <p className="mt-2 text-center text-[11px] uppercase tracking-wider text-dim">AEO citation score</p>
          {report && (
            <p className="mt-2 text-center text-xs text-mint">Projected {report.projectedScore} if the pack ships</p>
          )}
        </article>
        <div className="grid gap-3 md:grid-cols-3">
          {(report?.engines ?? []).map((engine) => (
            <article key={engine.id} className="rounded-3xl border border-line bg-panel/80 p-4">
              <p className="text-sm">{engine.name}</p>
              <p className={`mt-2 font-serif text-2xl ${engine.cited ? "text-mint" : "text-coral"}`}>
                {engine.rank ? `Position ${engine.rank}` : "Not cited"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-dim">{engine.answer}</p>
            </article>
          ))}
          {scanning && !report && <p className="text-sm text-dim md:col-span-3">Scanning answer engines…</p>}
        </div>
      </div>

      {report && (
        <>
          <ul className="grid gap-2 md:grid-cols-2">
            {report.gaps.map((gap) => (
              <li key={gap.title} className="rounded-3xl border border-line px-4 py-3">
                <p className="text-sm text-gold-2">{gap.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-dim">{gap.detail}</p>
              </li>
            ))}
          </ul>
          <article className="rounded-3xl border border-line bg-ink/60">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <p className="text-sm">JSON-LD schema and citation pack</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-1 text-xs"
                  onClick={() => {
                    void navigator.clipboard.writeText(json).then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1400);
                    });
                  }}
                >
                  {copied ? "Copied" : "Copy pack"}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-gold px-3 py-1 text-xs text-ink"
                  onClick={() => downloadJson(`${live.business}-jsonld.json`, json)}
                >
                  Download JSON-LD
                </button>
              </div>
            </div>
            <pre className="max-h-80 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-gold-2">{json}</pre>
          </article>
        </>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const length = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * length;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={`Citation score ${score} out of 100`}>
      <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#e6c48a"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${length}`}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="66" textAnchor="middle" fill="#f6e6c8" fontSize="28" fontFamily="Georgia, serif">
        {score}
      </text>
    </svg>
  );
}

function downloadJson(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  anchor.click();
  URL.revokeObjectURL(url);
}
