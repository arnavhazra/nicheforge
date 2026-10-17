"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCohort, type Lead } from "@/lib/cohort";
import { usd } from "@/lib/http";
import { useLive } from "./live";

const LABELS = {
  hot: "Hot Booking Intent",
  price: "Price Question",
  timing: "Timing Follow-up",
  dnc: "Opt-Out / DNC",
} as const;

export function ReactivationPillar() {
  const live = useLive();
  const cohort = useMemo(() => buildCohort(live.niche.id), [live.niche.id]);
  const [sent, setSent] = useState(0);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  const revealed = cohort.leads.slice(0, sent);
  const counts = {
    hot: revealed.filter((lead) => lead.outcome === "hot").length,
    price: revealed.filter((lead) => lead.outcome === "price").length,
    timing: revealed.filter((lead) => lead.outcome === "timing").length,
    dnc: revealed.filter((lead) => lead.outcome === "dnc").length,
  };
  const replies = counts.hot + counts.price + counts.timing + counts.dnc;
  const pipeline = revealed.reduce((sum, lead) => sum + lead.recoveredUsd, 0);
  const done = sent >= cohort.total && !running;
  const feed = revealed.filter((lead) => lead.outcome !== "none").slice(-5).reverse();
  const preview = cohort.leads.slice(0, 8);

  function launch() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setSent(0);
    setRunning(true);
    let cursor = 0;
    const step = () => {
      cursor = Math.min(cohort.total, cursor + 40);
      setSent(cursor);
      if (cursor < cohort.total) timers.current.push(window.setTimeout(step, 420));
      else setRunning(false);
    };
    timers.current.push(window.setTimeout(step, 180));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Dead-lead database</p>
          <h2 className="font-serif text-4xl text-gold-2">{usd(done ? cohort.summary.pipeline : pipeline)}</h2>
          <p className="text-sm text-dim">Pipeline recovered for {live.business}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={launch}
            disabled={running}
            className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            Launch Throttled SMS Reactivation Wave
          </button>
          <a
            href={`/api/demo/cohort?niche=${live.niche.id}&city=${encodeURIComponent(live.cityLine)}&format=csv`}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Download 480-row CSV
          </a>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full bg-gold transition-all" style={{ width: `${(sent / cohort.total) * 100}%` }} />
      </div>
      <p className="font-mono text-xs text-dim">
        Batch {Math.min(12, Math.ceil(sent / 40) || 0)} / 12 · {sent} sent · A2P 10DLC cap 60 sms/min · demo clock ×20 · quiet hours 08:00–20:00
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => (
          <article key={key} className="rounded-3xl border border-line bg-panel/80 p-4">
            <p className="text-[11px] uppercase tracking-wider text-dim">{LABELS[key]}</p>
            <p className="mt-2 font-serif text-4xl">{counts[key]}</p>
            <p className="text-xs text-dim">of {cohort.summary[key]}</p>
          </article>
        ))}
      </div>

      <p className="rounded-3xl border border-line bg-panel/60 px-4 py-3 text-sm leading-relaxed">
        {done
          ? `${cohort.total} leads → ${cohort.summary.replies} replies (${cohort.summary.replyRate}%) → ${cohort.summary.bookedLabel} → ${usd(cohort.summary.pipeline)} pipeline generated`
          : `${sent} of ${cohort.total} stale rows touched · ${replies} replies so far · ${usd(pipeline)} on the board`}
        {live.niche.id === "hvac" && done && " · 18 emergency dispatches and 6 system installs."}
      </p>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="overflow-hidden rounded-3xl border border-line">
          <table className="w-full text-left text-sm">
            <caption className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-dim">
              Cohort preview · 6–18 months cold · {live.city}
            </caption>
            <thead className="text-[11px] uppercase tracking-wider text-dim">
              <tr>
                <th className="px-4 py-2 font-medium">Lead</th>
                <th className="px-4 py-2 font-medium">Age</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Wave</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((lead, index) => (
                <tr key={lead.id} className="border-t border-line">
                  <td className="px-4 py-2">
                    {lead.firstName} {lead.lastName}
                    <span className="block text-[11px] text-dim">{lead.source}</span>
                  </td>
                  <td className="px-4 py-2 text-dim">{lead.ageMonths} mo</td>
                  <td className="px-4 py-2 text-dim">{lead.status}</td>
                  <td className="px-4 py-2">{waveCell(lead, index < sent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="rounded-3xl border border-line bg-panel/80 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Live reply tape</p>
          <ul className="mt-3 space-y-3">
            {feed.length === 0 && <li className="text-sm text-dim">Replies classify here as the wave moves.</li>}
            {feed.map((lead) => (
              <li key={lead.id}>
                <p className="text-sm">
                  {lead.firstName} {lead.lastName} · {LABELS[lead.outcome === "none" ? "timing" : lead.outcome]}
                </p>
                <p className="text-xs text-dim">
                  “{lead.snippet}”
                  {lead.recoveredUsd > 0 ? ` · ${usd(lead.recoveredUsd)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </div>
      <p className="text-xs text-dim">
        Production workers keep the 60 message/minute cap and write DNC before the next send. This cockpit compresses the clock so you can show the whole wave on the call.
      </p>
    </div>
  );
}

function waveCell(lead: Lead, touched: boolean) {
  if (!touched) return <span className="text-dim">Queued</span>;
  if (lead.outcome === "none") return <span className="text-dim">Sent</span>;
  return <span className="text-mint">{LABELS[lead.outcome]}</span>;
}
