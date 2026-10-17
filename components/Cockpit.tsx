"use client";

import { useEffect, useState } from "react";
import { getNiche, NICHES, type NicheId } from "@/lib/niches";
import { AeoPillar } from "./AeoPillar";
import { FulfillPillar } from "./FulfillPillar";
import { LiveProvider, useLive } from "./live";
import { ReactivationPillar } from "./ReactivationPillar";
import { VoicePillar } from "./VoicePillar";

const PILLARS = [
  { id: "voice", index: "01", title: "Missed-call & voice", hint: "Text-back under 1.2s" },
  { id: "reactivate", index: "02", title: "Dead-lead wave", hint: "480 stale CRM rows" },
  { id: "aeo", index: "03", title: "AEO scanner", hint: "ChatGPT, Perplexity, AIO" },
  { id: "fulfill", index: "04", title: "Fulfillment compiler", hint: "Margin stays at 99.1%" },
] as const;

type PillarId = (typeof PILLARS)[number]["id"];

export function Cockpit() {
  const starter = getNiche("peptide");
  const [nicheId, setNicheId] = useState<NicheId>("peptide");
  const [business, setBusiness] = useState(starter.business);
  const [city, setCity] = useState(`${starter.city}, ${starter.state}`);
  const [pillar, setPillar] = useState<PillarId>("voice");
  const [health, setHealth] = useState<"ok" | "down" | "loading">("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => (response.ok ? setHealth("ok") : setHealth("down")))
      .catch(() => setHealth("down"));
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const found = PILLARS.find((item) => item.index.endsWith(event.key));
      if (found) setPillar(found.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function chooseNiche(id: NicheId) {
    const niche = getNiche(id);
    setNicheId(id);
    setBusiness(niche.business);
    setCity(`${niche.city}, ${niche.state}`);
  }

  return (
    <LiveProvider nicheId={nicheId} businessInput={business} cityInput={city}>
      <div className="flex h-dvh flex-col">
        <header className="shrink-0 border-b border-line bg-ink/75 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="mr-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Studio</p>
              <p className="font-serif text-2xl leading-none">NicheForge</p>
            </div>
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {NICHES.map((niche) => {
                const active = niche.id === nicheId;
                return (
                  <button
                    key={niche.id}
                    type="button"
                    onClick={() => chooseNiche(niche.id)}
                    className={`min-w-[8.5rem] rounded-2xl border px-3 py-2 text-left ${active ? "border-gold bg-panel-2" : "border-line"}`}
                  >
                    <span className="block text-sm">{niche.shortLabel}</span>
                    <span className="block truncate text-[11px] text-dim">{niche.city}</span>
                  </button>
                );
              })}
            </div>
            <label className="text-[11px] text-dim">
              Business
              <input
                aria-label="Prospect business name"
                value={business}
                maxLength={80}
                onChange={(event) => setBusiness(event.target.value)}
                className="mt-1 block w-52 rounded-xl border border-line bg-panel px-3 py-2 text-sm text-mist outline-none focus:border-gold"
              />
            </label>
            <label className="text-[11px] text-dim">
              City
              <input
                aria-label="Prospect city"
                value={city}
                maxLength={80}
                onChange={(event) => setCity(event.target.value)}
                className="mt-1 block w-40 rounded-xl border border-line bg-panel px-3 py-2 text-sm text-mist outline-none focus:border-gold"
              />
            </label>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-64 shrink-0 flex-col border-r border-line md:flex">
            <div className="space-y-1 p-3">
              {PILLARS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPillar(item.id)}
                  className={`block w-full rounded-2xl px-3 py-3 text-left ${pillar === item.id ? "bg-panel-2" : ""}`}
                >
                  <span className="font-mono text-[10px] text-gold">{item.index}</span>
                  <span className="mt-1 block text-sm">{item.title}</span>
                  <span className="block text-[11px] text-dim">{item.hint}</span>
                </button>
              ))}
            </div>
            <ProspectCard health={health} />
          </nav>
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="flex gap-2 overflow-x-auto border-b border-line px-3 py-2 md:hidden">
              {PILLARS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPillar(item.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs ${pillar === item.id ? "bg-gold text-ink" : "border border-line"}`}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <div className="px-4 py-4 md:px-6 md:py-6">
              <Stage pillar={pillar} nicheId={nicheId} />
            </div>
          </main>
        </div>
      </div>
    </LiveProvider>
  );
}

function Stage({ pillar, nicheId }: { pillar: PillarId; nicheId: NicheId }) {
  if (pillar === "voice") return <VoicePillar key={nicheId} />;
  if (pillar === "reactivate") return <ReactivationPillar key={nicheId} />;
  if (pillar === "aeo") return <AeoPillar key={`${nicheId}-aeo`} />;
  return <FulfillPillar key={nicheId} />;
}

function ProspectCard({ health }: { health: "ok" | "down" | "loading" }) {
  const live = useLive();
  return (
    <div className="mt-auto border-t border-line p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-dim">On the call</p>
      <p className="mt-2 font-serif text-xl leading-tight">{live.business}</p>
      <p className="text-sm text-dim">{live.cityLine}</p>
      <p className="mt-2 text-sm text-gold">{live.niche.economics}</p>
      <p className="mt-3 text-[11px] text-dim">{live.niche.vertical}</p>
      <p className={`mt-3 font-mono text-[10px] ${health === "ok" ? "text-mint" : "text-dim"}`}>
        {health === "ok" ? "runtime ok · 5 niches · 4 pillars" : health === "down" ? "runtime unreachable" : "checking runtime"}
      </p>
    </div>
  );
}
